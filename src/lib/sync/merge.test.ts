import { describe, expect, it } from "vitest";
import type { FieldMeta, Purchase, Warranty } from "@/lib/db/types";
import { mergeLatest, mergePurchase } from "./merge";

const t = (n: number) => `2026-01-0${n}T00:00:00.000Z`;
const user = (n: number): FieldMeta => ({ source: "user", updatedAt: t(n) });
const read = (n: number): FieldMeta => ({ source: "extracted", confidence: 0.8, updatedAt: t(n) });
const purchase = (updatedAt: number, fields: Partial<Purchase> = {}): Purchase => ({
  id: "p",
  createdAt: t(1),
  updatedAt: t(updatedAt),
  fieldMeta: {},
  ...fields,
});

describe("mergePurchase (D-17)", () => {
  it("takes the incoming record when there is none yet", () => {
    const incoming = purchase(2, { merchant: "Metro", fieldMeta: { merchant: user(2) } });
    expect(mergePurchase(undefined, incoming)).toBe(incoming);
  });

  it("lets a user edit beat a newer extracted value (rule 3)", () => {
    const device = purchase(2, { merchant: "Metro Thokar", fieldMeta: { merchant: user(2) } });
    const other = purchase(5, { merchant: "METRO", fieldMeta: { merchant: read(5) } });
    expect(mergePurchase(device, other).merchant).toBe("Metro Thokar");
    expect(mergePurchase(other, device).merchant).toBe("Metro Thokar");
  });

  it("uses the newer edit when both are user edits", () => {
    const a = purchase(2, { notes: "old", fieldMeta: { notes: user(2) } });
    const b = purchase(3, { notes: "new", fieldMeta: { notes: user(3) } });
    expect(mergePurchase(a, b).notes).toBe("new");
    expect(mergePurchase(b, a).notes).toBe("new");
  });

  it("merges different fields edited on two devices", () => {
    const phone = purchase(2, { merchant: "Metro", fieldMeta: { merchant: user(2) } });
    const laptop = purchase(3, { serial: "SN1", fieldMeta: { serial: user(3) } });
    const merged = mergePurchase(phone, laptop);
    expect(merged).toMatchObject({ merchant: "Metro", serial: "SN1", updatedAt: t(3) });
    expect(merged.fieldMeta).toEqual({ merchant: user(2), serial: user(3) });
  });

  it("keeps a user's clearing of a field", () => {
    const cleared = purchase(4, { fieldMeta: { serial: user(4) } });
    const old = purchase(2, { serial: "SN1", fieldMeta: { serial: user(2) } });
    expect(mergePurchase(old, cleared).serial).toBeUndefined();
  });

  it("follows the newer record for delete, restore and reminder switch", () => {
    const deleted = purchase(3, { deletedAt: t(3) });
    const restored = purchase(4, { remindersOff: true });
    const merged = mergePurchase(deleted, restored);
    expect(merged.deletedAt).toBeUndefined();
    expect(merged.remindersOff).toBe(true);
    expect(mergePurchase(purchase(2), deleted).deletedAt).toBe(t(3));
  });

  it("gives the same result whichever side merges (devices converge)", () => {
    const a = purchase(3, { merchant: "A", notes: "x", fieldMeta: { merchant: read(3), notes: user(1) } });
    const b = purchase(2, { merchant: "B", notes: "y", fieldMeta: { merchant: user(2), notes: user(2) } });
    expect(mergePurchase(a, b)).toEqual(mergePurchase(b, a));
  });
});

describe("mergeLatest", () => {
  const warranty = (n: number, provider: string): Warranty => ({ id: "w", purchaseId: "p", createdAt: t(1), updatedAt: t(n), provider });

  it("keeps the newer record", () => {
    expect(mergeLatest(warranty(2, "old"), warranty(3, "new")).provider).toBe("new");
    expect(mergeLatest(warranty(3, "new"), warranty(2, "old")).provider).toBe("new");
    expect(mergeLatest(undefined, warranty(2, "only")).provider).toBe("only");
  });
});
