import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPurchase } from "../lib/purchases";
import { RecentPurchases } from "./RecentPurchases";

describe("RecentPurchases", () => {
  afterEach(() => db.purchases.clear());

  it("shows a friendly empty state", async () => {
    render(<RecentPurchases />);
    expect(await screen.findByText(/Nothing saved yet/)).toBeDefined();
  });

  it("links each saved purchase to its detail page", async () => {
    const purchase = await createPurchase({ productName: "Kettle", merchant: "Metro" });
    render(<RecentPurchases />);
    const link = await screen.findByRole("link", { name: /Kettle/ });
    expect(link.getAttribute("href")).toBe(`/p/${purchase.id}`);
  });
});
