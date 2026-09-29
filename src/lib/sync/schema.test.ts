import { describe, expect, expectTypeOf, it } from "vitest";
import type { Purchase, VaultDocument, Warranty } from "@/lib/db/types";
import { documentWire, pullQuery, purchaseWire, pushBody, type DocumentWire, type PurchaseWire, type WarrantyWire } from "./schema";

const at = "2026-03-14T10:00:00.000Z";
const purchaseId = "5b6f9c3e-2a51-4c8e-9a51-0f1f6f2f9d10";

describe("sync wire schema", () => {
  it("accepts a partial purchase (FR-12)", () => {
    expect(purchaseWire.safeParse({ id: purchaseId, createdAt: at, updatedAt: at, fieldMeta: {} }).success).toBe(true);
  });

  it("rejects bad ids, dates, amounts and unknown meta fields", () => {
    const base = { id: purchaseId, createdAt: at, updatedAt: at, fieldMeta: {} };
    expect(purchaseWire.safeParse({ ...base, id: "../../etc" }).success).toBe(false);
    expect(purchaseWire.safeParse({ ...base, purchaseDate: "14/03/2026" }).success).toBe(false);
    expect(purchaseWire.safeParse({ ...base, amount: "1,299" }).success).toBe(false);
    expect(purchaseWire.safeParse({ ...base, fieldMeta: { cardNumber: { source: "user", updatedAt: at } } }).success).toBe(false);
  });

  it("requires document file descriptions within limits (D-20)", () => {
    const doc = {
      id: purchaseId, purchaseId, createdAt: at, updatedAt: at, type: "receipt", pageCount: 1,
      sha256: "a".repeat(64), sizeBytes: 10, files: [{ index: 0, mimeType: "image/jpeg", hasEnhanced: true }],
    };
    expect(documentWire.safeParse(doc).success).toBe(true);
    expect(documentWire.safeParse({ ...doc, files: [] }).success).toBe(false);
    expect(documentWire.safeParse({ ...doc, files: [{ index: 25, mimeType: "image/jpeg", hasEnhanced: false }] }).success).toBe(false);
  });

  it("bounds a push and parses the pull cursor", () => {
    expect(pushBody.safeParse({ purchases: [], documents: [], warranties: [], purged: [] }).success).toBe(true);
    expect(pullQuery.parse({})).toEqual({ cursor: "0" });
    expect(pullQuery.safeParse({ cursor: "-1" }).success).toBe(false);
  });
});

describe("wire and local shapes", () => {
  it("line up, so records travel without reshaping (checked by tsc)", () => {
    expectTypeOf<Purchase>().toExtend<PurchaseWire>();
    expectTypeOf<Warranty>().toExtend<WarrantyWire>();
    expectTypeOf<Omit<DocumentWire, "files">>().toExtend<VaultDocument>();
  });
});
