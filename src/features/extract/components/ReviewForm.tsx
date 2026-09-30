"use client";

import { useState } from "react";
import { moveDocuments } from "@/features/documents/lib/documents";
import { DuplicateWarning } from "@/features/duplicates/components/DuplicateWarning";
import { similarPurchases } from "@/features/duplicates/lib/duplicates";
import { amountProblem } from "@/features/purchases/lib/amount";
import { formatDate } from "@/features/purchases/lib/display";
import { softDeletePurchase } from "@/features/purchases/lib/purchases";
import { PURCHASE_FIELDS } from "@/features/purchases/lib/fieldConfig";
import type { Purchase } from "@/lib/db/types";
import { REVIEW_FIELDS, initialValues, saveReview, type ReviewField, type Suggestions } from "../lib/review";
import { needsCheck } from "../lib/types";

type Props = {
  purchase: Purchase;
  suggestions: Suggestions;
  notice?: string;
  /** Called with the purchase to open next: this one, or the existing one it was added to. */
  onSaved: (purchaseId: string) => void;
};

const CONFIG = new Map(PURCHASE_FIELDS.map((config) => [config.field, config]));

export function ReviewForm({ purchase, suggestions, notice, onSaved }: Props) {
  const [values, setValues] = useState(() => initialValues(purchase, suggestions));
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [similar, setSimilar] = useState<Purchase[]>([]);
  const [amountError, setAmountError] = useState<string>();
  const foundAny = Object.values(suggestions).some(Boolean);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    const problem = amountProblem(values.amount);
    setAmountError(problem);
    if (problem) return;
    setSaving(true);
    try {
      const saved = await saveReview(purchase.id, suggestions, values);
      const matches = await similarPurchases(saved);
      if (matches.length > 0) {
        setSimilar(matches);
        setSaving(false);
        return;
      }
      onSaved(purchase.id);
    } catch (error) {
      console.error("Could not save reviewed details", error);
      setFailed(true);
      setSaving(false);
    }
  }

  /** User chose to keep one purchase: documents move there, this one goes to Recently Deleted. */
  async function addToExisting(existing: Purchase) {
    await moveDocuments(purchase.id, existing.id);
    await softDeletePurchase(purchase.id);
    onSaved(existing.id);
  }

  if (similar.length > 0) {
    return (
      <DuplicateWarning
        reason="similar"
        matches={similar}
        onSaveAnyway={() => onSaved(purchase.id)}
        onAddToExisting={addToExisting}
        onCancel={() => setSimilar([])}
      />
    );
  }

  return (
    <form onSubmit={save} className="flex flex-col gap-4">
      <h2 className="text-2xl font-bold">{foundAny ? "We found these details" : "Add the details you know"}</h2>
      <p className="text-muted">
        {notice ?? (foundAny ? "Check them and fix anything that's wrong. Everything is optional." : "Everything is optional — you can add more later.")}
      </p>

      {REVIEW_FIELDS.map((field) => (
        <ReviewInput
          key={field}
          field={field}
          value={values[field]}
          suggestion={suggestions[field]}
          problem={field === "amount" ? amountError : undefined}
          onChange={(value) => setValues((current) => ({ ...current, [field]: value }))}
        />
      ))}

      {failed && (
        <p role="alert" className="text-danger">
          The details weren&apos;t saved. Please try again.
        </p>
      )}
      <button type="submit" disabled={saving} className="rounded-card bg-primary px-6 py-4 text-lg font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60">
        {saving ? "Saving…" : "Save"}
      </button>
    </form>
  );
}

type InputProps = {
  field: ReviewField;
  value: string;
  suggestion: Suggestions[ReviewField];
  /** Why the typed value can't be saved, shown under the input. */
  problem?: string;
  onChange: (value: string) => void;
};

function ReviewInput({ field, value, suggestion, problem, onChange }: InputProps) {
  const config = CONFIG.get(field);
  const check = needsCheck(suggestion);
  const id = `review-${field}`;
  const problemId = problem ? `${id}-problem` : undefined;

  return (
    <div className={check ? "rounded-card bg-attention-surface p-3" : undefined}>
      <label htmlFor={id} className="block text-sm font-medium text-muted">
        {config?.label}
        {check && <span className="ml-2 font-semibold text-attention">Please check</span>}
      </label>
      <input
        id={id}
        type={config?.input === "date" ? "date" : "text"}
        inputMode={config?.input === "amount" ? "decimal" : undefined}
        value={value}
        maxLength={config?.maxLength}
        aria-invalid={problem ? true : undefined}
        aria-describedby={problemId}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-card border border-line bg-background px-3 py-2"
      />
      {problem && (
        <p id={problemId} role="alert" className="mt-1 text-sm text-danger">
          {problem}
        </p>
      )}
      {suggestion?.candidates && (
        <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={`Possible ${config?.label.toLowerCase()} values`}>
          {suggestion.candidates.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={candidate === value}
              onClick={() => onChange(candidate)}
              className="rounded-full border border-line bg-background px-3 py-1 text-sm aria-pressed:border-primary aria-pressed:font-semibold"
            >
              {config?.input === "date" ? formatDate(candidate) : candidate}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
