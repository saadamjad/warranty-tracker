import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { VaultDocument } from "@/lib/db/types";
import { downloadMissingPages, uploadPendingFiles } from "./files";

const t = "2026-03-01T00:00:00.000Z";
const doc = (extra: Partial<VaultDocument> = {}): VaultDocument => ({
  id: "d1", purchaseId: "p1", type: "receipt", pageCount: 1, sha256: "a".repeat(64), sizeBytes: 1, createdAt: t, updatedAt: t, ...extra,
});
const fetchMock = vi.fn();

describe("sync files", () => {
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(async () => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("uploads original and easier copy, then marks the document uploaded without changing updatedAt", async () => {
    await db.documents.add(doc());
    await db.pages.add({ documentId: "d1", index: 0, original: new Blob(["o"]), enhanced: new Blob(["e"]), mimeType: "image/png" });
    fetchMock
      .mockResolvedValueOnce(Response.json({ urls: [{ index: 0, variant: "original", url: "https://s3/o" }, { index: 0, variant: "enhanced", url: "https://s3/e" }] }))
      .mockResolvedValue(new Response(null, { status: 200 }));

    await uploadPendingFiles();

    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ documentId: "d1", files: [{ index: 0, variant: "original" }, { index: 0, variant: "enhanced" }] });
    expect(fetchMock.mock.calls[1]).toEqual(["https://s3/o", expect.objectContaining({ method: "PUT", headers: { "Content-Type": "image/png" } })]);
    const stored = await db.documents.get("d1");
    expect(stored?.uploadedAt).toBeDefined();
    expect(stored?.updatedAt).toBe(t);
  });

  it("waits for the next run when the server doesn't have the document yet", async () => {
    await db.documents.add(doc());
    await db.pages.add({ documentId: "d1", index: 0, original: new Blob(["o"]), mimeType: "image/png" });
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 404 }));
    await uploadPendingFiles();
    expect((await db.documents.get("d1"))?.uploadedAt).toBeUndefined();
  });

  it("downloads pages of restored documents (FR-29)", async () => {
    await db.documents.add(doc({ pagesMissing: true, remoteFiles: [{ index: 0, mimeType: "application/pdf", hasEnhanced: false }] }));
    fetchMock
      .mockResolvedValueOnce(Response.json({ urls: [{ index: 0, variant: "original", url: "https://s3/o" }] }))
      .mockResolvedValueOnce(new Response(new Blob(["%PDF"])));

    await downloadMissingPages();

    const [page] = await db.pages.where("documentId").equals("d1").toArray();
    expect(page.mimeType).toBe("application/pdf");
    expect(await page.original.text()).toBe("%PDF");
    expect((await db.documents.get("d1"))?.pagesMissing).toBeUndefined();
  });
});
