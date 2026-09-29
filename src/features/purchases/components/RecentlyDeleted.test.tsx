import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPurchase, getPurchase, softDeletePurchase } from "../lib/purchases";
import { RecentlyDeleted } from "./RecentlyDeleted";

async function deletedKettle() {
  const { id } = await createPurchase({ productName: "Kettle" });
  await softDeletePurchase(id);
  return id;
}

describe("RecentlyDeleted", () => {
  afterEach(() => db.purchases.clear());

  it("lists deleted purchases with days left and restores one", async () => {
    const id = await deletedKettle();
    render(<RecentlyDeleted />);
    expect(await screen.findByText("Kettle")).toBeDefined();
    expect(screen.getByText("30 days left to restore")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    await waitFor(async () => expect((await getPurchase(id))?.deletedAt).toBeUndefined());
    expect(await screen.findByText(/Nothing here/)).toBeDefined();
  });

  it("asks before deleting forever", async () => {
    const id = await deletedKettle();
    render(<RecentlyDeleted />);
    fireEvent.click(await screen.findByRole("button", { name: "Delete forever…" }));
    expect(screen.getByText(/can't be undone/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Delete forever" }));
    await waitFor(async () => expect(await getPurchase(id)).toBeUndefined());
  });
});
