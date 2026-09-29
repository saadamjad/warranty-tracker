import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { createPurchase, getPurchase } from "../lib/purchases";
import { DeletePurchase } from "./DeletePurchase";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

describe("DeletePurchase", () => {
  afterEach(() => Promise.all([db.purchases.clear(), db.documents.clear()]));

  it("confirms with document count, soft deletes and returns home (AC-18)", async () => {
    const { id } = await createPurchase();
    const at = new Date().toISOString();
    await db.documents.add({ id: "d1", purchaseId: id, type: "receipt", pageCount: 1, sha256: "x", sizeBytes: 1, createdAt: at, updatedAt: at });

    render(<DeletePurchase id={id} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete purchase" }));
    expect(await screen.findByText(/its 1 document\./)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/"));
    expect((await getPurchase(id))?.deletedAt).toBeDefined();
  });

  it("does nothing when cancelled", async () => {
    const { id } = await createPurchase();
    render(<DeletePurchase id={id} />);
    fireEvent.click(screen.getByRole("button", { name: "Delete purchase" }));
    fireEvent.click(await screen.findByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Delete purchase" })).toBeDefined();
    expect((await getPurchase(id))?.deletedAt).toBeUndefined();
  });
});
