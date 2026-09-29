import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { addDocument, listDocuments } from "../lib/documents";
import { DocumentsSection } from "./DocumentsSection";

const page = { original: new Blob(["x"]), mimeType: "image/jpeg" };

describe("DocumentsSection", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("shows all documents together with a way to add more (AC-5)", async () => {
    const { id } = await createPurchase();
    await addDocument({ purchaseId: id, type: "receipt", pages: [page] });
    await addDocument({ purchaseId: id, type: "warranty", pages: [page, page] });
    render(<DocumentsSection purchaseId={id} />);
    expect(await screen.findByText(/receipt · 1 page/)).toBeDefined();
    expect(screen.getByText(/warranty card · 2 pages/)).toBeDefined();
    expect(screen.getByRole("link", { name: "+ Add document" }).getAttribute("href")).toBe(`/add?to=${id}`);
  });

  it("removes a document after confirming", async () => {
    const { id } = await createPurchase();
    await addDocument({ purchaseId: id, type: "receipt", pages: [page] });
    render(<DocumentsSection purchaseId={id} />);
    fireEvent.click(await screen.findByRole("button", { name: /View receipt/ }));
    fireEvent.click(screen.getByRole("button", { name: "Remove document" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    await waitFor(async () => expect(await listDocuments(id)).toEqual([]));
  });
});
