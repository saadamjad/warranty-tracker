import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { MAX_OCR_TEXT } from "@/lib/sync/schema";
import { addDocument, getPages, listDocuments, removeDocument, setDocumentText, setDocumentType } from "./documents";

const page = (text: string) => ({ original: new Blob([text]), mimeType: "image/jpeg" });

describe("documents lib", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("stores a multi-page document with pages in order (EC-01)", async () => {
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "receipt", pages: [page("1"), page("2"), page("3")] });
    expect(document).toMatchObject({ pageCount: 3, sizeBytes: 3, type: "receipt" });
    expect(document.sha256).toMatch(/^[0-9a-f]{64}$/);
    const pages = await getPages(document.id);
    expect(await Promise.all(pages.map((p) => p.original.text()))).toEqual(["1", "2", "3"]);
  });

  it("keeps receipt and warranty card together on one purchase (EC-03, AC-4, AC-5)", async () => {
    const { id } = await createPurchase();
    await addDocument({ purchaseId: id, type: "receipt", pages: [page("r")] });
    const warranty = await addDocument({ purchaseId: id, type: "other", pages: [page("w")] });
    await setDocumentType(warranty.id, "warranty");
    expect((await listDocuments(id)).map((d) => d.type)).toEqual(["receipt", "warranty"]);
  });

  it("hides removed documents but keeps their files", async () => {
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "receipt", pages: [page("r")] });
    await removeDocument(document.id);
    expect(await listDocuments(id)).toEqual([]);
    expect(await getPages(document.id)).toHaveLength(1);
  });

  it("refuses an empty document", async () => {
    await expect(addDocument({ purchaseId: "p", type: "receipt", pages: [] })).rejects.toThrow();
  });

  it("keeps read text within what the backup accepts", async () => {
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "warranty", pages: [page("terms")] });
    await setDocumentText(document.id, "x".repeat(MAX_OCR_TEXT + 10));
    expect((await db.documents.get(document.id))?.ocrText).toHaveLength(MAX_OCR_TEXT);
  });
});
