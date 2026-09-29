import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Purchase } from "@/lib/db/types";
import { DuplicateWarning } from "./DuplicateWarning";

const tv: Purchase = { id: "tv", createdAt: "", updatedAt: "", fieldMeta: {}, productName: "TV", merchant: "Hi-Fi" };

describe("DuplicateWarning", () => {
  it("offers save anyway, add to existing and cancel", () => {
    const onAddToExisting = vi.fn();
    const onSaveAnyway = vi.fn();
    render(<DuplicateWarning reason="same-file" matches={[tv]} onSaveAnyway={onSaveAnyway} onAddToExisting={onAddToExisting} onCancel={vi.fn()} />);
    expect(screen.getByRole("heading", { name: "You've saved this file before" })).toBeDefined();
    fireEvent.click(screen.getByRole("button", { name: "Add to “TV” instead" }));
    expect(onAddToExisting).toHaveBeenCalledWith(tv);
    fireEvent.click(screen.getByRole("button", { name: "Save anyway" }));
    expect(onSaveAnyway).toHaveBeenCalled();
  });
});
