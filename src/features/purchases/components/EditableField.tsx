"use client";

import { useId } from "react";
import type { FieldInput } from "../lib/fieldConfig";

type Props = {
  label: string;
  input: FieldInput;
  value: string | undefined;
  /** Called on blur, only when the value actually changed. */
  onSave: (value: string) => void;
};

const inputClass = "mt-1 w-full rounded-card border border-line bg-background px-3 py-2";

export function EditableField({ label, input, value = "", onSave }: Props) {
  const id = useId();

  function commit(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    if (event.target.value !== value) onSave(event.target.value);
  }

  // key resets the uncontrolled input when the stored value changes elsewhere.
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
      </label>
      {input === "multiline" ? (
        <textarea id={id} key={value} defaultValue={value} onBlur={commit} rows={3} className={inputClass} />
      ) : (
        <input
          id={id}
          key={value}
          type={input === "date" ? "date" : "text"}
          inputMode={input === "amount" ? "decimal" : undefined}
          defaultValue={value}
          onBlur={commit}
          className={inputClass}
        />
      )}
    </div>
  );
}
