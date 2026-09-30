import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addDocument } from "@/features/documents/lib/documents";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { ReadTimeoutError } from "../lib/reader";
import { ReadAndReview } from "./ReadAndReview";

const extractDocument = vi.fn();
vi.mock("../lib/extract", () => ({ extractDocument: (...args: unknown[]) => extractDocument(...args) }));

describe("ReadAndReview", () => {
  afterEach(async () => {
    vi.clearAllMocks();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("shows found details after reading", async () => {
    extractDocument.mockResolvedValueOnce({ text: "", fields: { merchant: { value: "Metro", confidence: 0.9 } } });
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} onDiscard={vi.fn(async () => undefined)} />);
    expect(screen.getByText("Reading your receipt…")).toBeDefined();
    expect(await screen.findByRole("heading", { name: "We found these details" })).toBeDefined();
    expect((screen.getByLabelText("Store") as HTMLInputElement).value).toBe("Metro");
  });

  it("falls back to manual entry when reading times out (AC-14, AC-15)", async () => {
    extractDocument.mockRejectedValueOnce(new ReadTimeoutError());
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} onDiscard={vi.fn(async () => undefined)} />);
    expect(await screen.findByText(/taking too long/)).toBeDefined();
  });

  it("can skip reading", async () => {
    extractDocument.mockReturnValueOnce(new Promise(() => {}));
    const { id } = await createPurchase();
    render(<ReadAndReview purchaseId={id} documentId="d" onDone={vi.fn()} onDiscard={vi.fn(async () => undefined)} />);
    fireEvent.click(screen.getByRole("button", { name: "Skip — enter details myself" }));
    expect(await screen.findByRole("heading", { name: "Add the details you know" })).toBeDefined();
  });

  it("shows the uploaded photo while reading and while reviewing", async () => {
    extractDocument.mockResolvedValueOnce({ text: "", fields: {} });
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "receipt", pages: [{ original: new Blob(["x"]), mimeType: "image/jpeg" }] });
    render(<ReadAndReview purchaseId={id} documentId={document.id} onDone={vi.fn()} onDiscard={vi.fn(async () => undefined)} />);
    expect(await screen.findByRole("img", { name: "Page 1" })).toBeDefined();
    await screen.findByRole("heading", { name: "Add the details you know" });
    expect(screen.getByRole("img", { name: "Page 1" })).toBeDefined();
  });

  it("removes the photo with × and explains when that fails", async () => {
    extractDocument.mockReturnValueOnce(new Promise(() => {}));
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "receipt", pages: [{ original: new Blob(["x"]), mimeType: "image/jpeg" }] });
    const onDiscard = vi.fn(async () => Promise.reject(new Error("storage")));
    render(<ReadAndReview purchaseId={id} documentId={document.id} onDone={vi.fn()} onDiscard={onDiscard} />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove this photo and choose another" }));
    expect(await screen.findByText(/couldn't be removed/)).toBeDefined();
    expect(onDiscard).toHaveBeenCalled();
  });
});
