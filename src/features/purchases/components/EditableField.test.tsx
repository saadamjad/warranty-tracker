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
});
