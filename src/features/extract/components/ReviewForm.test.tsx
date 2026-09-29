import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPurchase, getPurchase } from "@/features/purchases/lib/purchases";
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

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    const saved = await getPurchase(purchase.id);
    expect(saved).toMatchObject({ merchant: "Metro Thokar", purchaseDate: "2026-04-05" });
    expect(saved?.fieldMeta.merchant?.source).toBe("user");
  });

  it("lets the user fill in details when nothing was read (AC-14)", async () => {
    const purchase = await createPurchase();
    render(<ReviewForm purchase={purchase} suggestions={{}} onSaved={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "Add the details you know" })).toBeDefined();
    expect((screen.getByLabelText("Purchase date") as HTMLInputElement).value).toBe("");
  });
});
