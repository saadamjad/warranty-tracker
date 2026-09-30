import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableField } from "./EditableField";

describe("EditableField", () => {
  it("saves a changed value on blur", () => {
    const onSave = vi.fn();
    render(<EditableField label="Store" input="text" value="Metro" onSave={onSave} />);
    const input = screen.getByLabelText("Store");
    fireEvent.change(input, { target: { value: "Makro" } });
    fireEvent.blur(input);
    expect(onSave).toHaveBeenCalledWith("Makro");
  });

  it("does not save when nothing changed", () => {
    const onSave = vi.fn();
    render(<EditableField label="Notes" input="multiline" value={undefined} onSave={onSave} />);
    fireEvent.blur(screen.getByLabelText("Notes"));
    expect(onSave).not.toHaveBeenCalled();
  });

  it("explains an amount that isn't a number instead of saving it", () => {
    const onSave = vi.fn();
    render(<EditableField label="Amount" input="amount" value={undefined} onSave={onSave} />);
    const input = screen.getByLabelText("Amount");
    fireEvent.change(input, { target: { value: "Rs 500" } });
    fireEvent.blur(input);
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toBe("Enter the amount as a number, like 1299.00.");
    expect(input.getAttribute("aria-invalid")).toBe("true");
  });

  it("limits text to what backup accepts", () => {
    render(<EditableField label="Currency" input="text" value={undefined} maxLength={10} onSave={vi.fn()} />);
    expect(screen.getByLabelText("Currency").getAttribute("maxLength")).toBe("10");
  });
});
