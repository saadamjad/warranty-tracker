import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { BackupPrompt } from "./BackupPrompt";

describe("BackupPrompt", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("appears at the 3rd purchase and can be postponed", async () => {
    await createPurchase();
    await createPurchase();
    const { container } = render(<BackupPrompt />);
    await createPurchase();
    expect(await screen.findByRole("heading", { name: "Keep your 3 purchases safe" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Not now" }));
    await waitFor(() => expect(container.textContent).toBe(""));
  });
});
