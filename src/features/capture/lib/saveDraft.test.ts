import { afterEach, describe, expect, it, vi } from "vitest";
import { listDocuments } from "@/features/documents/lib/documents";
import { createPurchase, listPurchases } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { draftReducer, emptyDraft } from "./draft";
import { DraftError, saveDraft } from "./saveDraft";

vi.mock("./enhance", () => ({ enhanceImage: vi.fn(async () => new Blob(["enhanced"])) }));
const pageCount = vi.fn(async () => 3);
vi.mock("@/features/documents/lib/pdf", () => ({ pdfPageCount: () => pageCount() }));

let n = 0;
const draftOf = (...files: File[]) => draftReducer(emptyDraft, { type: "add", files, makeId: () => `id-${++n}` });
const photo = () => new File(["photo"], "r.jpg", { type: "image/jpeg" });
const pdf = () => new File(["%PDF"], "i.pdf", { type: "application/pdf" });

describe("saveDraft", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("saves photos as one document on a new purchase, keeping originals (AC-16)", async () => {
    const purchaseId = await saveDraft({ draft: draftOf(photo(), photo()), type: "receipt" });
    const [document] = await listDocuments(purchaseId);
    expect(document.pageCount).toBe(2);
    const pages = await db.pages.where("documentId").equals(document.id).toArray();
    expect(await pages[0].original.text()).toBe("photo");
    expect(await pages[0].enhanced?.text()).toBe("enhanced");
  });

  it("adds a warranty card to an existing purchase (AC-4)", async () => {
    const { id } = await createPurchase({ productName: "TV" });
    await saveDraft({ draft: draftOf(photo()), type: "warranty", purchaseId: id });
    expect((await listDocuments(id)).map((d) => d.type)).toEqual(["warranty"]);
    expect(await listPurchases()).toHaveLength(1);
  });

  it("stores a PDF once with its page count", async () => {
    const purchaseId = await saveDraft({ draft: draftOf(pdf()), type: "invoice" });
    expect((await listDocuments(purchaseId))[0]).toMatchObject({ pageCount: 3, type: "invoice" });
  });

  it("rejects an over-long PDF without creating a purchase", async () => {
    pageCount.mockResolvedValueOnce(25);
    await expect(saveDraft({ draft: draftOf(pdf()), type: "invoice" })).rejects.toBeInstanceOf(DraftError);
    expect(await listPurchases()).toEqual([]);
  });
});
