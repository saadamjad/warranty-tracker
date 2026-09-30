import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPurchase, getPurchase, listPurchases } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import type { Suggestions } from "../lib/review";
import { ReviewForm } from "./ReviewForm";

const suggestions: Suggestions = {
  merchant: { value: "Metro", confidence: 0.9 },
  purchaseDate: { value: "2026-05-04", confidence: 0.4, candidates: ["2026-05-04", "2026-04-05"] },
};

describe("ReviewForm", () => {
  afterEach(() => db.purchases.clear());

  it("highlights uncertain fields in words, offers choices and saves a fix (AC-2)", async () => {
    const purchase = await createPurchase();
    const onSaved = vi.fn();
    render(<ReviewForm purchase={purchase} suggestions={suggestions} onSaved={onSaved} />);

    expect(screen.getByRole("heading", { name: "We found these details" })).toBeDefined();
    expect(screen.getByText("Please check")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "5 Apr 2026" }));
    fireEvent.change(screen.getByLabelText("Store"), { target: { value: "Metro Thokar" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(purchase.id));
    const saved = await getPurchase(purchase.id);
    expect(saved).toMatchObject({ merchant: "Metro Thokar", purchaseDate: "2026-04-05" });
    expect(saved?.fieldMeta.merchant?.source).toBe("user");
  });

  it("explains an amount that isn't a number and doesn't save it", async () => {
    const purchase = await createPurchase();
    const onSaved = vi.fn();
    render(<ReviewForm purchase={purchase} suggestions={{}} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "Rs 500" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(screen.getByRole("alert").textContent).toBe("Enter the amount as a number, like 1299.00.");
    expect(onSaved).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Amount"), { target: { value: "1,299" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(purchase.id));
    expect((await getPurchase(purchase.id))?.amount).toBe("1299.00");
  });

  it("lets the user fill in details when nothing was read (AC-14)", async () => {
    const purchase = await createPurchase();
    render(<ReviewForm purchase={purchase} suggestions={{}} onSaved={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add the details you know" })).toBeDefined();
    expect((screen.getByLabelText("Purchase date") as HTMLInputElement).value).toBe("");
  });

  it("warns about a same store, date and amount purchase and can join them (AC-17)", async () => {
    const existing = await createPurchase({ merchant: "Metro", purchaseDate: "2026-08-12", amount: "700.00" });
    const purchase = await createPurchase();
    const onSaved = vi.fn();
    const found: Suggestions = {
      merchant: { value: "Metro", confidence: 0.9 },
      purchaseDate: { value: "2026-08-12", confidence: 0.9 },
      amount: { value: "700.00", confidence: 0.9 },
    };
    render(<ReviewForm purchase={purchase} suggestions={found} onSaved={onSaved} />);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByRole("heading", { name: "This looks like a purchase you already have" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /instead$/ }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(existing.id));
    expect((await listPurchases()).map((p) => p.id)).toEqual([existing.id]);
  });
});
