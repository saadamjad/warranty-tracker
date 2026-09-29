import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addWarranty, listDatedWarranties, listWarranties, removeWarranty, updateWarranty } from "./warranties";

describe("warranties lib", () => {
  afterEach(() => db.warranties.clear());

  it("keeps several warranties per purchase (EC-28)", async () => {
    await addWarranty("p1", { provider: "Samsung", endDate: "2027-03-14" });
    await addWarranty("p1", { provider: "Extended cover", startDate: "2027-03-14", endDate: "2029-03-14" });
    expect((await listWarranties("p1")).map((w) => w.provider)).toEqual(["Samsung", "Extended cover"]);
  });

  it("allows a start date independent of purchase (EC-07) and clears blanks", async () => {
    const warranty = await addWarranty("p1", { startDate: "2026-04-01" });
    await updateWarranty(warranty.id, { startDate: "2026-04-10", provider: "  " });
    const stored = await db.warranties.get(warranty.id);
    expect(stored?.startDate).toBe("2026-04-10");
    expect(stored?.provider).toBeUndefined();
  });

  it("removes softly and only lists dated live warranties for reminders", async () => {
    const dated = await addWarranty("p1", { endDate: "2027-01-01" });
    await addWarranty("p1", {});
    const removed = await addWarranty("p2", { endDate: "2027-01-01" });
    await removeWarranty(removed.id);
    expect((await listDatedWarranties()).map((w) => w.id)).toEqual([dated.id]);
    expect(await listWarranties("p2")).toEqual([]);
  });
});
