// Minimal RFC 4180 CSV. Cells that a spreadsheet would run as a formula are prefixed with
// an apostrophe (CSV injection), since exported notes and store names are user text.

const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: string | number | undefined): string {
  const text = value === undefined ? "" : String(value);
  const safe = FORMULA_START.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(header: string[], rows: (string | number | undefined)[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
