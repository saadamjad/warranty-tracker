import { isValid } from "date-fns";
import type { Found } from "./types";

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const MONTH = "(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?";

// Numeric: 2026-03-14 · 14/03/2026 · 03/14/2026 · 14.03.26
const YMD = /\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b/g;
const DMY_OR_MDY = /\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4}|\d{2})\b/g;
// Words: 14 Mar 2026 · 14-Mar-26 · 14th March, 2026 · March 14, 2026
const DAY_MONTH_YEAR = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?[\\s-]+${MONTH}[\\s,-]+(\\d{4}|\\d{2})\\b`, "gi");
const MONTH_DAY_YEAR = new RegExp(`\\b${MONTH}\\s+(\\d{1,2})(?:st|nd|rd|th)?,?\\s+(\\d{4})\\b`, "gi");

// Purchase date sits next to these; the others name dates that are not the purchase date.
const PURCHASE_HINT = /\b(date|dated|purchased?|sold|bill|invoice|receipt|order)\b/i;
const OTHER_DATE_HINT = /\b(due|expir\w*|valid|warranty|until|till|return\w*|delivery)\b/i;

/**
 * Finds the purchase date. A date like 04/05/2026 could be 4 May or 5 April, so it comes
 * back with both as candidates instead of a silent guess (rule 4). Nothing found → undefined (EC-06).
 */
export function findPurchaseDate(text: string, today: Date = new Date()): Found | undefined {
  const hits = text
    .split("\n")
    .flatMap((line) => datesInLine(line, today).map((dates) => ({ dates, line })));
  if (hits.length === 0) return undefined;

  const hinted = hits.filter((hit) => PURCHASE_HINT.test(hit.line) && !OTHER_DATE_HINT.test(hit.line));
  const neutral = hits.filter((hit) => !OTHER_DATE_HINT.test(hit.line));
  const best = hinted[0] ?? neutral[0] ?? hits[0];

  const others = unique(hits.flatMap((hit) => hit.dates)).filter((date) => !best.dates.includes(date));
  const ambiguous = best.dates.length > 1;
  const confidence = ambiguous ? 0.4 : hinted.length > 0 ? 0.9 : others.length > 0 ? 0.5 : 0.75;
  const candidates = ambiguous ? best.dates : hinted.length === 0 && others.length > 0 ? [best.dates[0], ...others] : undefined;

  return { value: best.dates[0], confidence, ...(candidates && { candidates: unique(candidates).slice(0, 4) }) };
}

/** Each entry is one date as written; more than one value means the order is ambiguous. */
function datesInLine(line: string, today: Date): string[][] {
  const found: string[][] = [];
  const keep = (options: (string | undefined)[]) => {
    const valid = unique(options.filter((date): date is string => Boolean(date) && plausible(date!, today)));
    if (valid.length) found.push(valid);
  };

  for (const m of line.matchAll(YMD)) keep([toIso(+m[1], +m[2], +m[3])]);
  for (const m of line.matchAll(DMY_OR_MDY)) {
    if (/\b20\d{2}[-/.]/.test(m.input.slice(Math.max(0, m.index - 5), m.index + 1))) continue; // part of a YMD
    const year = fullYear(m[3]);
    const [a, b] = [+m[1], +m[2]];
    // Day-first is the local default (D-22), so it goes first when both readings are valid.
    keep([toIso(year, b, a), toIso(year, a, b)]);
  }
  for (const m of line.matchAll(DAY_MONTH_YEAR)) keep([toIso(fullYear(m[3]), monthNumber(m[2]), +m[1])]);
  for (const m of line.matchAll(MONTH_DAY_YEAR)) keep([toIso(+m[3], monthNumber(m[1]), +m[2])]);
  return found;
}

function toIso(year: number, month: number, day: number): string | undefined {
  const date = new Date(Date.UTC(year, month - 1, day));
  if (!isValid(date) || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return undefined;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function plausible(iso: string, today: Date): boolean {
  const limit = new Date(today);
  limit.setDate(limit.getDate() + 1);
  return iso >= "2000-01-01" && iso <= limit.toISOString().slice(0, 10);
}

function fullYear(year: string): number {
  return year.length === 2 ? 2000 + Number(year) : Number(year);
}

function monthNumber(name: string): number {
  return MONTHS.indexOf(name.slice(0, 3).toLowerCase()) + 1;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
