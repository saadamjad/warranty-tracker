import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { purchaseHref } from "@/lib/routes";
import { SearchView } from "./SearchView";

describe("SearchView", () => {
  afterEach(() => db.purchases.clear());

  it("finds a purchase as the user types and says where it matched (AC-6, AC-7)", async () => {
    const { id } = await createPurchase({ productName: "Philips Kettle", merchant: "Metro" });
    render(<SearchView initialQuery="" />);
    fireEvent.change(screen.getByLabelText("Search your purchases"), { target: { value: "metr" } });
    const link = await screen.findByRole("link", { name: /Philips Kettle/ });
    expect(link.getAttribute("href")).toBe(purchaseHref(id));
    expect(link.textContent).toContain("Store: Metro");
  });

  it("suggests what to try when nothing matches", async () => {
    render(<SearchView initialQuery="zzzz" />);
    expect(await screen.findByText(/Nothing matches/)).toBeDefined();
  });
});
