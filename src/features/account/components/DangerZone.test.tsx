import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createPurchase, listPurchases } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { DangerZone } from "./DangerZone";

const assign = vi.fn();

describe("DangerZone", () => {
  afterEach(async () => {
    vi.unstubAllGlobals();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("warns a guest that removal can't be undone, then wipes the device", async () => {
    vi.stubGlobal("location", { ...window.location, assign });
    await createPurchase({ productName: "TV" });
    render(<DangerZone />);
    fireEvent.click(await screen.findByRole("button", { name: "Remove everything from this device" }));
    expect(screen.getByText(/can't be undone. Download them first/)).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Remove everything" }));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/"));
    expect(await listPurchases()).toEqual([]);
  });
});
