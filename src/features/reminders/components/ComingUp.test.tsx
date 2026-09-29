import { render, screen } from "@testing-library/react";
import { addDays, format } from "date-fns";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { addWarranty } from "@/features/warranty/lib/warranties";
import { db } from "@/lib/db";
import { purchaseHref } from "@/lib/routes";
import { ComingUp } from "./ComingUp";

const inDays = (days: number) => format(addDays(new Date(), days), "yyyy-MM-dd");

describe("ComingUp", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("lists deadlines that are coming up, linking to the purchase", async () => {
    const tv = await createPurchase({ productName: "TV" });
    await addWarranty(tv.id, { endDate: inDays(12) });
    await createPurchase({ productName: "Shoes", returnDeadline: inDays(1) });
    render(<ComingUp />);
    expect(await screen.findByRole("link", { name: "Shoes — 1 day left to return" })).toBeDefined();
    expect(screen.getByRole("link", { name: "TV — Warranty ends in 12 days" }).getAttribute("href")).toBe(purchaseHref(tv.id));
  });

  it("shows nothing when nothing is due", async () => {
    await createPurchase({ productName: "Fridge" });
    const { container } = render(<ComingUp />);
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(container.textContent).toBe("");
  });
});
