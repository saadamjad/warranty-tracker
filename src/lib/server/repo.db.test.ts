import { randomUUID } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { DocumentWire, PurchaseWire, PushBody, WarrantyWire } from "@/lib/sync/schema";
import { prisma } from "./prisma";
import { ForbiddenRecordError, deleteAccount, pullChanges, pushChanges, purgeDeletedBefore } from "./repo";

const deleteObjects = vi.fn(async (keys: string[]) => void keys);
vi.mock("./storage", async (original) => ({
  ...(await original<typeof import("./storage")>()),
  deleteObjects: (keys: string[]) => deleteObjects(keys),
}));

const t = (n: number) => `2026-03-0${n}T10:00:00.000Z`;
const push = (userId: string, body: Partial<PushBody>) =>
  pushChanges(userId, { purchases: [], documents: [], warranties: [], purged: [], ...body });
const purchase = (fields: Partial<PurchaseWire> = {}): PurchaseWire => ({ id: randomUUID(), createdAt: t(1), updatedAt: t(1), fieldMeta: {}, ...fields });
const document = (purchaseId: string, fields: Partial<DocumentWire> = {}): DocumentWire => ({
  id: randomUUID(), purchaseId, createdAt: t(1), updatedAt: t(1), type: "receipt", pageCount: 1,
  sha256: "a".repeat(64), sizeBytes: 100, files: [{ index: 0, mimeType: "image/jpeg", hasEnhanced: true }], ...fields,
});
const warranty = (purchaseId: string, fields: Partial<WarrantyWire> = {}): WarrantyWire => ({
  id: randomUUID(), purchaseId, createdAt: t(1), updatedAt: t(1), ...fields,
});

async function user() {
  return (await prisma.user.create({ data: { email: `${randomUUID()}@test.local` } })).id;
}

describe("repo sync (Postgres)", () => {
  beforeEach(async () => {
    await prisma.change.deleteMany();
    await prisma.vault.deleteMany();
    await prisma.user.deleteMany();
    deleteObjects.mockClear();
  });
  afterAll(() => prisma.$disconnect());

  it("round-trips a full purchase with document and warranty (FR-29)", async () => {
    const me = await user();
    const p = purchase({ merchant: "Metro", purchaseDate: "2026-03-14", amount: "700.50", currency: "PKR", fieldMeta: { merchant: { source: "user", updatedAt: t(1) } } });
    const d = document(p.id, { ocrText: "TOTAL 700.50" });
    const w = warranty(p.id, { endDate: "2027-03-14" });
    await push(me, { purchases: [p], documents: [d], warranties: [w] });

    const pulled = await pullChanges(me, BigInt(0));
    expect(pulled.purchases).toEqual([p]);
    expect(pulled.documents).toEqual([d]);
    expect(pulled.warranties).toEqual([w]);
    expect(pulled.hasMore).toBe(false);
    expect((await pullChanges(me, BigInt(pulled.cursor))).purchases).toEqual([]);
  });

  it("merges per field: a user edit survives a newer extracted value (D-17)", async () => {
    const me = await user();
    const p = purchase({ merchant: "Metro Thokar", fieldMeta: { merchant: { source: "user", updatedAt: t(1) } } });
    await push(me, { purchases: [p] });
    await push(me, { purchases: [{ ...p, updatedAt: t(3), merchant: "METRO", fieldMeta: { merchant: { source: "extracted", updatedAt: t(3) } } }] });
    expect((await pullChanges(me, BigInt(0))).purchases[0].merchant).toBe("Metro Thokar");
  });

  it("never lets another user overwrite or read a record (SPEC §7)", async () => {
    const [me, them] = [await user(), await user()];
    const p = purchase({ notes: "mine" });
    await push(me, { purchases: [p] });

    await expect(push(them, { purchases: [{ ...p, updatedAt: t(5), notes: "theirs" }] })).rejects.toBeInstanceOf(ForbiddenRecordError);
    await expect(push(them, { documents: [document(p.id)] })).rejects.toBeInstanceOf(ForbiddenRecordError);
    expect((await pullChanges(them, BigInt(0))).purchases).toEqual([]);
    expect((await pullChanges(me, BigInt(0))).purchases[0].notes).toBe("mine");
  });

  it("keeps stored file content when metadata changes (append-only documents)", async () => {
    const me = await user();
    const p = purchase();
    const d = document(p.id);
    await push(me, { purchases: [p], documents: [d] });
    await push(me, { documents: [{ ...d, updatedAt: t(2), type: "warranty", sha256: "b".repeat(64) }] });
    const [stored] = (await pullChanges(me, BigInt(0))).documents;
    expect(stored).toMatchObject({ type: "warranty", sha256: "a".repeat(64) });
  });

  it("purges a purchase with its children and files (D-29)", async () => {
    const me = await user();
    const p = purchase();
    await push(me, { purchases: [p], documents: [document(p.id)], warranties: [warranty(p.id)] });
    const before = await pullChanges(me, BigInt(0));
    await push(me, { purged: [p.id] });

    const after = await pullChanges(me, BigInt(before.cursor));
    expect(after.purged).toEqual([p.id]);
    expect(await prisma.document.count({ where: { purchaseId: p.id } })).toBe(0);
    expect(deleteObjects.mock.calls[0][0]).toHaveLength(2);
  });

  it("pages through changes with a cursor", async () => {
    const me = await user();
    await push(me, { purchases: [purchase(), purchase(), purchase()] });
    const first = await pullChanges(me, BigInt(0), 2);
    const rest = await pullChanges(me, BigInt(first.cursor), 2);
    expect([first.purchases.length, first.hasMore, rest.purchases.length, rest.hasMore]).toEqual([2, true, 1, false]);
  });

  it("deletes an account with all its backed-up data and files, leaving others alone (BR-07)", async () => {
    const [me, them] = [await user(), await user()];
    const mine = purchase();
    await push(me, { purchases: [mine], documents: [document(mine.id)], warranties: [warranty(mine.id)] });
    await push(them, { purchases: [purchase()] });

    await deleteAccount(me);

    expect(await prisma.user.count({ where: { id: me } })).toBe(0);
    expect(await prisma.purchase.count({ where: { userId: me } })).toBe(0);
    expect(await prisma.change.count({ where: { userId: me } })).toBe(0);
    expect(await prisma.purchase.count({ where: { userId: them } })).toBe(1);
    expect(deleteObjects.mock.calls[0][0]).toHaveLength(2);
  });

  it("purges only data deleted before the cutoff and tells devices (D-19)", async () => {
    const me = await user();
    const old = purchase({ deletedAt: "2026-01-01T00:00:00.000Z" });
    const recent = purchase({ deletedAt: "2026-03-01T00:00:00.000Z" });
    const live = purchase();
    const oldDoc = document(live.id, { deletedAt: "2026-01-01T00:00:00.000Z" });
    await push(me, { purchases: [old, recent, live], documents: [document(old.id), oldDoc, document(live.id)] });
    const before = await pullChanges(me, BigInt(0));

    const result = await purgeDeletedBefore(new Date("2026-02-01T00:00:00.000Z"));

    expect(result).toEqual({ purchases: 1, documents: 1, warranties: 0 });
    expect((await prisma.purchase.findMany({ where: { userId: me } })).map((p) => p.id).sort()).toEqual([live.id, recent.id].sort());
    expect(await prisma.document.count({ where: { userId: me } })).toBe(1);
    expect((await pullChanges(me, BigInt(before.cursor))).purged).toEqual([old.id]);
    expect(deleteObjects.mock.calls[0][0]).toHaveLength(4);
  });
});
