import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPendingPurges } from "@/features/sync/lib/state";
import { db } from "@/lib/db";
import type { VaultDocument } from "@/lib/db/types";
import {
  countDocuments,
  createPurchase,
  daysLeftToRestore,
  deletePurchaseForever,
  getPurchase,
  listDeletedPurchases,
  listPurchases,
  restorePurchase,
  softDeletePurchase,
  updatePurchase,
} from "./purchases";

let clock = Date.parse("2026-03-01T00:00:00.000Z");
function tick() {
  clock += 1000;
  vi.setSystemTime(clock);
}

function doc(id: string, purchaseId: string, deletedAt?: string): VaultDocument {
  const at = new Date(clock).toISOString();
  return { id, purchaseId, type: "receipt", pageCount: 1, sha256: id, sizeBytes: 1, createdAt: at, updatedAt: at, deletedAt };
}

describe("purchases lib", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    tick();
  });
  afterEach(async () => {
    vi.useRealTimers();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("creates a purchase with no fields (AC-3)", async () => {
    const purchase = await createPurchase();
    expect(await getPurchase(purchase.id)).toMatchObject({ id: purchase.id, fieldMeta: {} });
  });

  it("edits after save and records the user as source (AC-8)", async () => {
    const { id } = await createPurchase({ productName: "Kettle" });
    tick();
    const updated = await updatePurchase(id, { merchant: "Metro" });
    expect(updated).toMatchObject({ productName: "Kettle", merchant: "Metro" });
    expect(updated.fieldMeta.merchant?.source).toBe("user");
  });

  it("lists live purchases newest first", async () => {
    const first = await createPurchase({ title: "First" });
    tick();
    const second = await createPurchase({ title: "Second" });
    tick();
    const gone = await createPurchase({ title: "Gone" });
    await softDeletePurchase(gone.id);
    expect((await listPurchases()).map((p) => p.id)).toEqual([second.id, first.id]);
  });

  it("soft deletes a purchase with its documents, and restores them (AC-18, D-29)", async () => {
    const { id } = await createPurchase();
    await db.documents.bulkAdd([doc("d1", id), doc("d2", id)]);
    expect(await countDocuments(id)).toBe(2);

    tick();
    await softDeletePurchase(id);
    expect(await countDocuments(id)).toBe(0);
    expect((await listDeletedPurchases()).map((p) => p.id)).toEqual([id]);

    tick();
    await restorePurchase(id);
    expect((await getPurchase(id))?.deletedAt).toBeUndefined();
    expect(await countDocuments(id)).toBe(2);
    expect(await listDeletedPurchases()).toEqual([]);
  });

  it("does not restore documents removed before the purchase was deleted", async () => {
    const { id } = await createPurchase();
    await db.documents.bulkAdd([doc("kept", id), doc("removed-earlier", id, "2026-01-01T00:00:00.000Z")]);
    tick();
    await softDeletePurchase(id);
    tick();
    await restorePurchase(id);
    expect((await db.documents.get("removed-earlier"))?.deletedAt).toBe("2026-01-01T00:00:00.000Z");
    expect(await countDocuments(id)).toBe(1);
  });

  it("removes a purchase, its documents and pages for good", async () => {
    const { id } = await createPurchase();
    await db.documents.add(doc("d1", id));
    await db.pages.add({ documentId: "d1", index: 0, original: new Blob(["x"]), mimeType: "image/png" });
    await deletePurchaseForever(id);
    expect(await getPurchase(id)).toBeUndefined();
    expect(await db.documents.count()).toBe(0);
    expect(await db.pages.count()).toBe(0);
    expect(await getPendingPurges()).toEqual([id]);
  });
});

describe("daysLeftToRestore", () => {
  it("counts down from 30 days and stops at zero", () => {
    const deletedAt = "2026-03-01T10:00:00.000Z";
    expect(daysLeftToRestore(deletedAt, new Date("2026-03-01T12:00:00.000Z"))).toBe(30);
    expect(daysLeftToRestore(deletedAt, new Date("2026-03-21T12:00:00.000Z"))).toBe(10);
    expect(daysLeftToRestore(deletedAt, new Date("2026-05-01T12:00:00.000Z"))).toBe(0);
  });
});
