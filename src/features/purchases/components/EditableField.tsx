"use client";

import { useId, useState } from "react";
import { amountProblem } from "../lib/amount";
import type { FieldInput } from "../lib/fieldConfig";

type Props = {
  label: string;
  input: FieldInput;
  value: string | undefined;
  /** Longest text the backup accepts for this field. */
  maxLength?: number;
  /** Called on blur, only when the value actually changed and can be stored. */
  onSave: (value: string) => void;
};

const inputClass = "mt-1 w-full rounded-card border border-line bg-background px-3 py-2";

export function EditableField({ label, input, value = "", maxLength, onSave }: Props) {
  const id = useId();
  const [problem, setProblem] = useState<string>();

  function commit(event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const typed = event.target.value;
    const found = input === "amount" ? amountProblem(typed) : undefined;
    setProblem(found);
    if (!found && typed !== value) onSave(typed);
  }

  const describedBy = problem ? `${id}-problem` : undefined;

  // key resets the uncontrolled input when the stored value changes elsewhere.
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {label}
      </label>
      {input === "multiline" ? (
        <textarea id={id} key={value} defaultValue={value} maxLength={maxLength} onBlur={commit} rows={3} className={inputClass} />
      ) : (
        <input
          id={id}
          key={value}
          type={input === "date" ? "date" : "text"}
          inputMode={input === "amount" ? "decimal" : undefined}
          defaultValue={value}
          maxLength={maxLength}
          aria-invalid={problem ? true : undefined}
          aria-describedby={describedBy}
          onBlur={commit}
          className={inputClass}
        />
      )}
      {problem && (
        <p id={describedBy} role="alert" className="mt-1 text-sm text-danger">
          {problem}
        </p>
      )}
    </div>
  );
}
