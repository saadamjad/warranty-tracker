import type { Found } from "./types";

// Values printed after a label, e.g. "Invoice No: INV-2031" or "S/N 8H2K..".
const VALUE = "[:#.\\-\\s]*([A-Z0-9][A-Z0-9\\-/]{2,30})";

const LABELS = {
  reference: /\b(?:invoice|inv|bill|receipt|order|txn|transaction|ref(?:erence)?)\s*(?:no\.?|number|num|#|id)?/i,
  serial: /\b(?:serial\s*(?:no\.?|number|#)?|s\/?n|imei(?:\s*[12](?=\s*[:#]))?)/i,
  model: /\b(?:model\s*(?:no\.?|number|#)?|m\/n)/i,
};

export type LabelledField = keyof typeof LABELS;

/** First value printed after the field's label. Labelled values are fairly reliable. */
export function findLabelled(text: string, field: LabelledField): Found | undefined {
  const pattern = new RegExp(LABELS[field].source + VALUE, "i");
  const values: string[] = [];
  for (const line of text.split("\n")) {
    const match = line.match(pattern);
    // A value must contain a digit, so words like "Invoice Date" aren't taken as numbers.
    if (match && /\d/.test(match[1])) values.push(match[1].replace(/[-/]+$/, ""));
  }
  const distinct = [...new Set(values)];
  if (distinct.length === 0) return undefined;
  return distinct.length === 1
    ? { value: distinct[0], confidence: 0.8 }
    : { value: distinct[0], confidence: 0.5, candidates: distinct.slice(0, 4) };
}

const WARRANTY =
  /\b(\d{1,2}|one|two|three|five)\s*[-\s]?\s*(years?|yrs?|months?|mths?)\b[^\n]{0,20}\bwarranty\b|\bwarranty\b[^\n\d]{0,20}(\d{1,2}|one|two|three|five)\s*[-\s]?\s*(years?|yrs?|months?|mths?)\b/i;
const WORDS: Record<string, number> = { one: 1, two: 2, three: 3, five: 5 };

/** Warranty length printed on the receipt, in months ("1 year warranty" → "12"). */
export function findWarrantyMonths(text: string): Found | undefined {
  const match = text.match(WARRANTY);
  if (!match) return undefined;
  const count = match[1] ?? match[3];
  const unit = (match[2] ?? match[4]).toLowerCase();
  const number = WORDS[count.toLowerCase()] ?? Number(count);
  const months = unit.startsWith("y") ? number * 12 : number;
  return months > 0 && months <= 120 ? { value: String(months), confidence: 0.75 } : undefined;
}
