import type { Found } from "./types";

// Only currencies the receipt actually shows; nothing is assumed (D-31).
const CURRENCY_SIGNS: [RegExp, string, number][] = [
  [/\b(PKR|Rs\.?|Rupees?)(?=[\s\d.:]|$)|₨/i, "PKR", 0.8],
  [/\bINR\b|₹/i, "INR", 0.9],
  [/\bUSD\b|US\$/i, "USD", 0.9],
  [/\bEUR\b|€/i, "EUR", 0.9],
  [/\bGBP\b|£/i, "GBP", 0.9],
  [/\bAED\b|\bDhs?\b/i, "AED", 0.9],
  [/\bSAR\b/i, "SAR", 0.9],
  [/\bCAD\b|C\$/i, "CAD", 0.9],
  [/\bAUD\b|A\$/i, "AUD", 0.9],
  // A bare "$" is used by several currencies, so the user should confirm it.
  [/\$/, "USD", 0.5],
];

export function findCurrency(text: string): Found | undefined {
  for (const [pattern, code, confidence] of CURRENCY_SIGNS) {
    if (pattern.test(text)) return { value: code, confidence };
  }
  return undefined;
}

// Higher rank wins. Lines naming sub-totals, tax, discounts or counts are never the amount paid.
const TOTAL_RANKS: [RegExp, number][] = [
  [/\bgrand\s*total\b/i, 3],
  [/\b(net\s*(amount|payable|total)|amount\s*(due|payable|paid)|total\s*(amount|payable|due|paid)|payable)\b/i, 2],
  [/\btotal\b/i, 1],
];
const NOT_TOTAL = /\b(sub\s*-?\s*total|total\s*(items?|qty|quantity|discount|savings?|tax|gst|vat)|tax|discount|change|cash\s*tendered|tendered)\b/i;
const NUMBER = /\d{1,3}(?:[,.' ]\d{3})+(?:[.,]\d{1,2})?|\d+(?:[.,]\d{1,2})?/g;

/** The amount paid: the number on the strongest "total" line; guesses are marked for checking. */
export function findAmount(text: string): Found | undefined {
  const totals: { value: string; rank: number }[] = [];
  const decimals: string[] = [];

  for (const line of text.split("\n")) {
    const raw = [...line.replace(/(\d)\s+(?=[.,]\d{2}\b)/g, "$1").matchAll(NUMBER)].map((match) => match[0]);
    const numbers = raw.map(normaliseNumber).filter((value): value is string => value !== undefined);
    if (numbers.length === 0) continue;

    const rank = NOT_TOTAL.test(line) ? 0 : (TOTAL_RANKS.find(([pattern]) => pattern.test(line))?.[1] ?? 0);
    if (rank > 0) totals.push({ value: numbers[numbers.length - 1], rank });
    // Without a total line, only prices written with cents are worth offering.
    const priced = raw.filter((text) => /[.,]\d{2}$/.test(text)).map(normaliseNumber);
    decimals.push(...priced.filter((value): value is string => value !== undefined));
  }

  if (totals.length > 0) {
    const top = Math.max(...totals.map((total) => total.rank));
    const best = unique(totals.filter((total) => total.rank === top).map((total) => total.value)).sort(byValueDesc);
    return best.length === 1
      ? { value: best[0], confidence: top >= 2 ? 0.9 : 0.8 }
      : { value: best[0], confidence: 0.5, candidates: best.slice(0, 4) };
  }

  const guesses = unique(decimals).filter((value) => Number(value) > 0).sort(byValueDesc).slice(0, 3);
  return guesses.length ? { value: guesses[0], confidence: 0.3, candidates: guesses } : undefined;
}

/** "1,299.00" · "1.299,00" · "12,500" · "1 299" → "1299.00". Returns undefined for non-amounts. */
export function normaliseNumber(raw: string): string | undefined {
  const text = raw.replace(/['\s]/g, "");
  const lastSeparator = Math.max(text.lastIndexOf("."), text.lastIndexOf(","));
  const decimalDigits = lastSeparator >= 0 ? text.length - lastSeparator - 1 : 0;
  const hasDecimals = lastSeparator >= 0 && decimalDigits <= 2;

  const whole = (hasDecimals ? text.slice(0, lastSeparator) : text).replace(/[.,]/g, "");
  const fraction = hasDecimals ? text.slice(lastSeparator + 1).padEnd(2, "0") : "00";
  if (!/^\d+$/.test(whole) || whole.length > 10) return undefined;
  return `${Number(whole)}.${fraction}`;
}

function byValueDesc(a: string, b: string): number {
  return Number(b) - Number(a);
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
