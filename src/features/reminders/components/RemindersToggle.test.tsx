import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase, getPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { RemindersToggle } from "./RemindersToggle";

describe("RemindersToggle", () => {
  afterEach(() => db.purchases.clear());

  it("is on by default and turns reminders off for this purchase (FR-19)", async () => {
    const purchase = await createPurchase();
    render(<RemindersToggle purchase={purchase} />);
    const box = screen.getByRole("checkbox") as HTMLInputElement;
    expect(box.checked).toBe(true);
    fireEvent.click(box);
    await waitFor(async () => expect((await getPurchase(purchase.id))?.remindersOff).toBe(true));
  });
});
