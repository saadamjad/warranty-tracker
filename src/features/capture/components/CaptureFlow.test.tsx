import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { listDocuments } from "@/features/documents/lib/documents";
import { getPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { purchaseHref } from "@/lib/routes";
import { CaptureFlow } from "./CaptureFlow";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("../lib/enhance", () => ({ enhanceImage: vi.fn(async () => undefined) }));
vi.mock("@/features/extract/lib/extract", () => ({
  extractDocument: vi.fn(async () => ({ text: "", fields: { merchant: { value: "Metro", confidence: 0.9 } } })),
}));

const photo = new File(["photo"], "receipt.jpg", { type: "image/jpeg" });

describe("CaptureFlow", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("always offers the manual path (FR-46)", () => {
    render(<CaptureFlow />);
    expect(screen.getByRole("button", { name: "Enter details myself" })).toBeDefined();
  });

  it("saves a photo, shows what was found, then opens the purchase (AC-2, AC-16)", async () => {
    render(<CaptureFlow />);
    fireEvent.change(screen.getByLabelText("Choose file"), { target: { files: [photo] } });
    expect(await screen.findByText(/1 page added/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "We found these details" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(push).toHaveBeenCalled());
    const purchaseId = String(push.mock.calls[0][0]).replace("/p?id=", "");
    expect(await listDocuments(purchaseId)).toHaveLength(1);
    expect((await getPurchase(purchaseId))?.merchant).toBe("Metro");
  });

  it("explains an unsupported file (AC-15)", async () => {
    render(<CaptureFlow />);
    const doc = new File(["x"], "notes.docx", { type: "application/msword" });
    fireEvent.change(screen.getByLabelText("Choose file"), { target: { files: [doc] } });
    expect((await screen.findByRole("alert")).textContent).toMatch(/isn't a photo or PDF/);
  });

  it("warns when the same file was saved before and can add it to that purchase (AC-17)", async () => {
    const { saveDraft } = await import("../lib/saveDraft");
    const { draftReducer, emptyDraft } = await import("../lib/draft");
    const first = await saveDraft({ draft: draftReducer(emptyDraft, { type: "add", files: [photo], makeId: () => "x" }), type: "receipt" });

    render(<CaptureFlow />);
    fireEvent.change(screen.getByLabelText("Choose file"), { target: { files: [photo] } });
    fireEvent.click(await screen.findByRole("button", { name: "Continue" }));
    expect(await screen.findByRole("heading", { name: "You've saved this file before" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: /instead$/ }));
    await waitFor(() => expect(push).toHaveBeenCalledWith(purchaseHref(first.purchaseId)));
    expect(await listDocuments(first.purchaseId)).toHaveLength(2);
  });
});
