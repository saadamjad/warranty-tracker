import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import type { PullResponse } from "@/lib/sync/schema";
import { applyPull } from "./apply";

const t = (n: number) => `2026-03-0${n}T00:00:00.000Z`;
const response = (fields: Partial<PullResponse>): PullResponse => ({ purchases: [], documents: [], warranties: [], purged: [], cursor: "1", hasMore: false, ...fields });

describe("applyPull", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("restores records on a new device, with files marked to download (FR-29)", async () => {
    await applyPull(response({
      purchases: [{ id: "p1", createdAt: t(1), updatedAt: t(1), fieldMeta: {}, productName: "TV" }],
      documents: [{ id: "d1", purchaseId: "p1", createdAt: t(1), updatedAt: t(1), type: "receipt", pageCount: 1, sha256: "a".repeat(64), sizeBytes: 5, files: [{ index: 0, mimeType: "image/jpeg", hasEnhanced: false }] }],
    }));
    expect((await db.purchases.get("p1"))?.productName).toBe("TV");
    expect(await db.documents.get("d1")).toMatchObject({ pagesMissing: true, uploadedAt: t(1) });
  });

  it("keeps the user's local edit against an older extracted value (D-17)", async () => {
    await db.purchases.add({ id: "p1", createdAt: t(1), updatedAt: t(2), merchant: "Metro Thokar", fieldMeta: { merchant: { source: "user", updatedAt: t(2) } } });
    await applyPull(response({ purchases: [{ id: "p1", createdAt: t(1), updatedAt: t(3), merchant: "METRO", fieldMeta: { merchant: { source: "extracted", updatedAt: t(3) } } }] }));
    expect((await db.purchases.get("p1"))?.merchant).toBe("Metro Thokar");
  });

  it("keeps local files and upload state when document details change elsewhere", async () => {
    await db.documents.add({ id: "d1", purchaseId: "p1", createdAt: t(1), updatedAt: t(1), type: "receipt", pageCount: 1, sha256: "a".repeat(64), sizeBytes: 5, uploadedAt: t(1) });
    await applyPull(response({ documents: [{ id: "d1", purchaseId: "p1", createdAt: t(1), updatedAt: t(4), type: "warranty", pageCount: 1, sha256: "a".repeat(64), sizeBytes: 5, files: [{ index: 0, mimeType: "image/jpeg", hasEnhanced: false }] }] }));
    const document = await db.documents.get("d1");
    expect(document).toMatchObject({ type: "warranty", uploadedAt: t(1) });
    expect(document?.pagesMissing).toBeUndefined();
  });

  it("removes purchases deleted forever on another device", async () => {
    await db.purchases.add({ id: "p1", createdAt: t(1), updatedAt: t(1), fieldMeta: {} });
    await db.warranties.add({ id: "w1", purchaseId: "p1", createdAt: t(1), updatedAt: t(1) });
    await applyPull(response({ purged: ["p1"] }));
    expect([await db.purchases.count(), await db.warranties.count()]).toEqual([0, 0]);
  });
});
