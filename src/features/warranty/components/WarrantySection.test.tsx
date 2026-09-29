import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { addWarranty, listWarranties } from "../lib/warranties";
import { WarrantySection } from "./WarrantySection";

describe("WarrantySection", () => {
  afterEach(() => Promise.all([db.purchases.clear(), db.warranties.clear()]));

  it("adds a warranty starting on the purchase date and sets a 1-year end", async () => {
    const purchase = await createPurchase({ purchaseDate: "2026-03-14" });
    render(<WarrantySection purchase={purchase} />);
    fireEvent.click(screen.getByRole("button", { name: "+ Add warranty" }));
    fireEvent.click(await screen.findByRole("button", { name: "1 year" }));
    await waitFor(async () => expect((await listWarranties(purchase.id))[0]).toMatchObject({ startDate: "2026-03-14", endDate: "2027-03-14" }));
  });

  it("shows an expired warranty as expired, not removed (EC-24)", async () => {
    const purchase = await createPurchase();
    await addWarranty(purchase.id, { endDate: "2020-01-01" });
    render(<WarrantySection purchase={purchase} />);
    expect(await screen.findByText(/Warranty expired/)).toBeDefined();
  });
});
