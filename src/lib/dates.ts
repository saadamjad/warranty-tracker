import { isValid, parseISO } from "date-fns";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

/**
 * A stored 'YYYY-MM-DD' as a Date, or undefined when it isn't a real calendar day.
 * Stored dates can be malformed (typed 5-digit years, old or synced data), and must never crash a screen.
 */
export function parseDay(value: string | undefined): Date | undefined {
  if (!value || !DAY.test(value)) return undefined;
  const date = parseISO(value);
  // Round-trip rejects days that don't exist, e.g. 2026-02-30.
  return isValid(date) && toDay(date) === value ? date : undefined;
}

/** A stored ISO timestamp as a Date, or undefined when unreadable. */
export function parseTimestamp(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  const date = parseISO(value);
  return isValid(date) ? date : undefined;
}

/** Local calendar day as 'YYYY-MM-DD'. */
export function toDay(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
