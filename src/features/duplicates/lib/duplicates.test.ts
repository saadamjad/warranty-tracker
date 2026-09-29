import { afterEach, describe, expect, it } from "vitest";
import { addDocument, listDocuments, moveDocuments } from "@/features/documents/lib/documents";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { purchasesWithSameFile, similarPurchases } from "./duplicates";

const page = (text: string) => ({ original: new Blob([text]), mimeType: "image/jpeg" });

describe("duplicates (D-12, AC-17)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("finds the purchase holding the same file (EC-17)", async () => {
    const first = await createPurchase({ productName: "TV" });
    const saved = await addDocument({ purchaseId: first.id, type: "receipt", pages: [page("receipt")] });
    expect((await purchasesWithSameFile(saved.sha256)).map((p) => p.id)).toEqual([first.id]);
    expect(await purchasesWithSameFile("other")).toEqual([]);
  });

  it("matches store + date + amount, ignoring case and amount format", async () => {
    await createPurchase({ merchant: "Metro", purchaseDate: "2026-08-12", amount: "700" });
    const again = await createPurchase({ merchant: " metro ", purchaseDate: "2026-08-12", amount: "700.00" });
    expect(await similarPurchases(again)).toHaveLength(1);
  });

  it("doesn't warn with a missing field or a different amount (EC-18)", async () => {
    await createPurchase({ merchant: "Metro", purchaseDate: "2026-08-12", amount: "700" });
    expect(await similarPurchases(await createPurchase({ merchant: "Metro", purchaseDate: "2026-08-12" }))).toEqual([]);
    expect(await similarPurchases(await createPurchase({ merchant: "Metro", purchaseDate: "2026-08-12", amount: "180" }))).toEqual([]);
  });

  it("moves documents between purchases only when asked", async () => {
    const keep = await createPurchase();
    const extra = await createPurchase();
    await addDocument({ purchaseId: extra.id, type: "warranty", pages: [page("w")] });
    await moveDocuments(extra.id, keep.id);
    expect(await listDocuments(keep.id)).toHaveLength(1);
    expect(await listDocuments(extra.id)).toHaveLength(0);
  });
});
