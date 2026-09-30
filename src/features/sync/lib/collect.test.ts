import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import type { Purchase, VaultDocument } from "@/lib/db/types";
import { collectChanges } from "./collect";

const [P1, OLD, D1, W1, A, B, C, D] = Array.from({ length: 8 }, (_, n) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`);
const t = (n: number) => `2026-03-01T00:00:${String(n).padStart(2, "0")}.000Z`;
const purchase = (id: string, n: number): Purchase => ({ id, createdAt: t(n), updatedAt: t(n), fieldMeta: {} });
const document = (id: string, purchaseId: string, n: number, extra: Partial<VaultDocument> = {}): VaultDocument => ({
  id, purchaseId, type: "receipt", pageCount: 1, sha256: "a".repeat(64), sizeBytes: 1, createdAt: t(n), updatedAt: t(n), ...extra,
});

describe("collectChanges (D-35)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("returns nothing when everything is backed up", async () => {
    await db.purchases.add(purchase(P1, 1));
    expect(await collectChanges(t(1))).toBeNull();
  });

  it("sends records newer than the watermark with page file descriptions", async () => {
    await db.purchases.bulkAdd([purchase(OLD, 1), purchase(P1, 2)]);
    await db.documents.add(document(D1, P1, 3, { uploadedAt: t(3) }));
    await db.pages.add({ documentId: D1, index: 0, original: new Blob(["x"]), enhanced: new Blob(["y"]), mimeType: "image/jpeg" });
    const batch = await collectChanges(t(1));
    expect(batch?.purchases.map((p) => p.id)).toEqual([P1]);
    expect(batch?.documents[0]).toMatchObject({ id: D1, files: [{ index: 0, mimeType: "image/jpeg", hasEnhanced: true }] });
    expect(batch?.documents[0]).not.toHaveProperty("uploadedAt");
    expect(batch?.upTo).toBe(t(3));
  });

  it("includes an unchanged parent purchase so the server can check ownership", async () => {
    await db.purchases.add(purchase(P1, 1));
    await db.warranties.add({ id: W1, purchaseId: P1, createdAt: t(5), updatedAt: t(5) });
    const batch = await collectChanges(t(2));
    expect(batch?.purchases.map((p) => p.id)).toEqual([P1]);
    expect(batch?.warranties.map((w) => w.id)).toEqual([W1]);
  });

  it("cuts batches between timestamps, never through equal ones", async () => {
    await db.purchases.bulkAdd([purchase(A, 1), purchase(B, 2), purchase(C, 2), purchase(D, 3)]);
    const first = await collectChanges("", 2);
    expect(first?.purchases.map((p) => p.id).sort()).toEqual([A, B, C]);
    const second = await collectChanges(first!.upTo, 2);
    expect(second?.purchases.map((p) => p.id)).toEqual([D]);
  });

  it("describes a restored document from what the backup knows", async () => {
    await db.purchases.add(purchase(P1, 1));
    await db.documents.add(document(D1, P1, 2, { pagesMissing: true, remoteFiles: [{ index: 0, mimeType: "application/pdf", hasEnhanced: false }] }));
    expect((await collectChanges(""))?.documents[0].files).toEqual([{ index: 0, mimeType: "application/pdf", hasEnhanced: false }]);
  });

  it("leaves out a record the backup would refuse, with what's attached, so the rest still goes", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await db.purchases.bulkAdd([{ ...purchase(A, 1), amount: "1,299.00" }, purchase(B, 2)]);
    await db.warranties.add({ id: W1, purchaseId: A, createdAt: t(3), updatedAt: t(3) });
    const batch = await collectChanges("");
    expect(batch?.purchases.map((p) => p.id)).toEqual([B]);
    expect(batch?.warranties).toEqual([]);
    expect(batch?.upTo).toBe(t(3));
  });
});
