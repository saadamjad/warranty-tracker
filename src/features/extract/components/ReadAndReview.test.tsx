import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { ReadTimeoutError } from "../lib/reader";
import { ReadAndReview } from "./ReadAndReview";

const extractDocument = vi.fn();
vi.mock("../lib/extract", () => ({ extractDocument: (...args: unknown[]) => extractDocument(...args) }));

describe("ReadAndReview", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await db.purchases.clear();
  });

  it("shows found details after reading", async () => {
    extractDocument.mockResolvedValueOnce({ text: "", fields: { merchant: { value: "Metro", confidence: 0.9 } } });
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} />);
    expect(screen.getByText("Reading your receipt…")).toBeDefined();
    expect(await screen.findByRole("heading", { name: "We found these details" })).toBeDefined();
    expect((screen.getByLabelText("Store") as HTMLInputElement).value).toBe("Metro");
  });

  it("falls back to manual entry when reading times out (AC-14, AC-15)", async () => {
    extractDocument.mockRejectedValueOnce(new ReadTimeoutError());
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} />);
    expect(await screen.findByText(/taking too long/)).toBeDefined();
  });

  it("can skip reading", async () => {
    extractDocument.mockReturnValueOnce(new Promise(() => {}));
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip — enter details myself" }));
    expect(await screen.findByRole("heading", { name: "Add the details you know" })).toBeDefined();
  });
});
