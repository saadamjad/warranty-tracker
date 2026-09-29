"use client";

import { useId } from "react";
import type { DocumentType } from "@/lib/db/types";
import { DOCUMENT_TYPE_LABELS } from "../lib/documents";

type Props = { value: DocumentType; onChange: (type: DocumentType) => void; label?: string };

export function DocumentTypePicker({ value, onChange, label = "This is a" }: Props) {
  const id = useId();
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-muted">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value as DocumentType)}
        className="rounded-card border border-line bg-background px-3 py-2"
      >
        {Object.entries(DOCUMENT_TYPE_LABELS).map(([type, text]) => (
          <option key={type} value={type}>
            {text}
          </option>
        ))}
      </select>
    </div>
  );
}
