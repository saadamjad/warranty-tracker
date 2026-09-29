import { addDays, format } from "date-fns";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { addWarranty } from "@/features/warranty/lib/warranties";
import { db } from "@/lib/db";
import { showDueReminders } from "./notify";

describe("showDueReminders (AC-10)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("shows the first warranty reminder once, then the final one once", async () => {
    const { id } = await createPurchase({ productName: "TV" });
    const today = new Date();
    await addWarranty(id, { endDate: format(addDays(today, 20), "yyyy-MM-dd") });
    const show = vi.fn();

    expect(await showDueReminders(show, today)).toBe(1);
    expect(show).toHaveBeenCalledWith("TV — Warranty ends in 20 days");
    expect(await showDueReminders(show, today)).toBe(0);

    expect(await showDueReminders(show, addDays(today, 14))).toBe(1);
    expect(show).toHaveBeenLastCalledWith("TV — Warranty ends in 6 days");
  });
});
