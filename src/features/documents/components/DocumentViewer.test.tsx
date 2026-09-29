import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { addDocument } from "../lib/documents";
import { DocumentViewer } from "./DocumentViewer";

const page = (text: string) => ({ original: new Blob([text]), enhanced: new Blob([`${text}+`]), mimeType: "image/jpeg" });

describe("DocumentViewer", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("pages through a document and switches to the original (FR-24)", async () => {
    const { id } = await createPurchase();
    const document = await addDocument({ purchaseId: id, type: "receipt", pages: [page("1"), page("2")] });
    render(<DocumentViewer document={document} />);

    expect(await screen.findByText("Page 1 of 2")).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Page 2 of 2")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Show original photo" }));
    expect(screen.getByRole("button", { name: "Show easier-to-read copy" })).toBeDefined();
    expect(screen.getByRole("link", { name: "Open file" })).toBeDefined();
  });
});
