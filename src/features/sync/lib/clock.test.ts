import { afterEach, describe, expect, it } from "vitest";
import { createPurchase, updatePurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { stamp } from "./clock";
import { collectChanges } from "./collect";
import { getWatermark, setWatermark } from "./state";

describe("stamp (D-35)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("is the current time when backup is behind it", async () => {
    await setWatermark("2026-01-01T00:00:00.000Z");
    expect(await stamp(new Date("2026-03-01T00:00:00.000Z"))).toBe("2026-03-01T00:00:00.000Z");
  });

  it("lands just after the watermark when another device's clock ran ahead", async () => {
    await setWatermark("2026-03-01T01:00:00.000Z");
    expect(await stamp(new Date("2026-03-01T00:00:00.000Z"))).toBe("2026-03-01T01:00:00.001Z");
  });

  it("keeps an edit made after pulling a future-dated record in the next backup", async () => {
    const purchase = await createPurchase();
    // A record from a device an hour ahead was backed up; the watermark followed it.
    await setWatermark(new Date(Date.now() + 60 * 60_000).toISOString());
    await updatePurchase(purchase.id, { notes: "edited" });
    const batch = await collectChanges(await getWatermark());
    expect(batch?.purchases.map((p) => p.notes)).toEqual(["edited"]);
  });
});
