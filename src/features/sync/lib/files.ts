import { db } from "@/lib/db";
import type { DocumentPage, VaultDocument } from "@/lib/db/types";
import type { FileUrl, UploadUrlBody } from "@/lib/sync/files";
import { SyncHttpError, postJson } from "./http";

// Page files travel straight between the device and storage via short-lived URLs;
// the app server never handles file bytes.

/** Uploads files of documents whose details are backed up but whose files aren't yet. */
export async function uploadPendingFiles(): Promise<void> {
  const pending = await db.documents.filter((document) => !document.uploadedAt && !document.pagesMissing).toArray();
  for (const document of pending) {
    try {
      await uploadDocument(document);
    } catch (error) {
      // Not on the server yet (created during this sync): the next run picks it up.
      if (error instanceof SyncHttpError && error.status === 404) continue;
      throw error;
    }
  }
}

async function uploadDocument(document: VaultDocument): Promise<void> {
  const pages = await db.pages.where("documentId").equals(document.id).sortBy("index");
  if (pages.length === 0) return;
  const files: UploadUrlBody["files"] = pages.flatMap((page) => [
    { index: page.index, variant: "original" as const },
    ...(page.enhanced ? [{ index: page.index, variant: "enhanced" as const }] : []),
  ]);
  const { urls } = await postJson<{ urls: FileUrl[] }>("/api/files/upload-url", { documentId: document.id, files });

  for (const { index, variant, url } of urls) {
    const page = pages.find((candidate) => candidate.index === index);
    const blob = variant === "original" ? page?.original : page?.enhanced;
    if (!page || !blob) continue;
    const contentType = variant === "original" ? page.mimeType : "image/jpeg";
    const response = await fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } });
    if (!response.ok) throw new SyncHttpError(response.status);
  }
  // Device-only flag: doesn't change updatedAt, so it never triggers another push.
  await db.documents.update(document.id, { uploadedAt: new Date().toISOString() });
}

/** Downloads page files of restored documents (FR-29). Deleted ones wait until restored. */
export async function downloadMissingPages(): Promise<void> {
  const missing = await db.documents.filter((document) => Boolean(document.pagesMissing) && !document.deletedAt).toArray();
  for (const document of missing) await downloadDocument(document);
}

async function downloadDocument(document: VaultDocument): Promise<void> {
  const { urls } = await postJson<{ urls: FileUrl[] }>("/api/files/download-url", { documentId: document.id });
  const pages = new Map<number, DocumentPage>();

  for (const { index, variant, url } of urls) {
    const response = await fetch(url);
    if (!response.ok) throw new SyncHttpError(response.status);
    const blob = await response.blob();
    const mimeType = document.remoteFiles?.find((file) => file.index === index)?.mimeType ?? blob.type;
    const page = pages.get(index) ?? { documentId: document.id, index, original: blob, mimeType };
    if (variant === "original") page.original = blob;
    else page.enhanced = blob;
    pages.set(index, page);
  }

  await db.transaction("rw", db.pages, db.documents, async () => {
    await db.pages.bulkPut([...pages.values()]);
    await db.documents.update(document.id, { pagesMissing: undefined });
  });
}
