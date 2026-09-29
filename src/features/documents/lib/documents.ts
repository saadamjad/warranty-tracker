import { db } from "@/lib/db";
import type { DocumentPage, DocumentType, VaultDocument } from "@/lib/db/types";
import { hashPages } from "./hash";

// Client data access for documents; components call these, never Dexie directly.

export type NewPage = { original: Blob; enhanced?: Blob; mimeType: string };

export type NewDocument = {
  purchaseId: string;
  type: DocumentType;
  pages: NewPage[];
  /** A PDF is stored as one file holding many pages; pass its real page count. */
  pageCount?: number;
};

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  receipt: "Receipt",
  invoice: "Invoice",
  warranty: "Warranty card",
  other: "Other",
};

/** Adds a document with ordered pages to a purchase (FR-13, FR-35, EC-01, EC-03). */
export async function addDocument({ purchaseId, type, pages, pageCount }: NewDocument): Promise<VaultDocument> {
  if (pages.length === 0) throw new Error("A document needs at least one page");
  const originals = pages.map((page) => page.original);
  const sha256 = await hashPages(originals);
  const now = new Date().toISOString();
  const document: VaultDocument = {
    id: crypto.randomUUID(),
    purchaseId,
    type,
    pageCount: pageCount ?? pages.length,
    sha256,
    sizeBytes: originals.reduce((sum, blob) => sum + blob.size, 0),
    createdAt: now,
    updatedAt: now,
  };
  const rows: DocumentPage[] = pages.map((page, index) => ({ documentId: document.id, index, ...page }));

  await db.transaction("rw", db.documents, db.pages, db.purchases, async () => {
    await db.documents.add(document);
    await db.pages.bulkAdd(rows);
    // Keeps the purchase at the top of the recent list.
    await db.purchases.update(purchaseId, { updatedAt: now });
  });
  return document;
}

export async function listDocuments(purchaseId: string): Promise<VaultDocument[]> {
  const documents = await db.documents.where("purchaseId").equals(purchaseId).sortBy("createdAt");
  return documents.filter((document) => !document.deletedAt);
}

export async function getPages(documentId: string): Promise<DocumentPage[]> {
  return db.pages.where("documentId").equals(documentId).sortBy("index");
}

/** Text read from the document, card numbers already removed; used by search (FR-21, EC-02). */
export async function setDocumentText(id: string, ocrText: string): Promise<void> {
  await db.documents.update(id, { ocrText, updatedAt: new Date().toISOString() });
}

export async function setDocumentType(id: string, type: DocumentType): Promise<void> {
  await db.documents.update(id, { type, updatedAt: new Date().toISOString() });
}

/** Soft delete a single document; the original stays until purged (rule 5, D-19). */
export async function removeDocument(id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.documents.update(id, { deletedAt: now, updatedAt: now });
}
