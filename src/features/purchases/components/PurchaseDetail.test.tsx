import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { createPurchase, getPurchase, softDeletePurchase } from "../lib/purchases";
import { PurchaseDetail } from "./PurchaseDetail";

describe("PurchaseDetail", () => {
  afterEach(() => db.purchases.clear());

  it("saves an edited field as a user edit (AC-8)", async () => {
    const { id } = await createPurchase({ productName: "Kettle" });
    render(<PurchaseDetail id={id} />);
    const store = await screen.findByLabelText("Store");
    fireEvent.change(store, { target: { value: "Metro" } });
    fireEvent.blur(store);
    await waitFor(async () => expect((await getPurchase(id))?.merchant).toBe("Metro"));
  });

  it("renames the purchase (EC-25)", async () => {
    const { id } = await createPurchase({ productName: "Kettle" });
    render(<PurchaseDetail id={id} />);
    const name = await screen.findByLabelText("Purchase name");
    fireEvent.change(name, { target: { value: "Kitchen kettle" } });
    fireEvent.blur(name);
    await waitFor(async () => expect((await getPurchase(id))?.title).toBe("Kitchen kettle"));
  });

  it("explains when the purchase is not on this device", async () => {
    render(<PurchaseDetail id="missing" />);
    expect(await screen.findByText(/couldn't find this purchase/)).toBeDefined();
  });

  it("offers restore for a deleted purchase (D-29)", async () => {
    const { id } = await createPurchase();
    await softDeletePurchase(id);
    render(<PurchaseDetail id={id} />);
    fireEvent.click(await screen.findByRole("button", { name: "Restore" }));
    await waitFor(async () => expect((await getPurchase(id))?.deletedAt).toBeUndefined());
  });
});
