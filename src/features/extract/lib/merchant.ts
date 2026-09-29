import type { Found } from "./types";

// Top-of-receipt lines that are headings or boilerplate, not the shop's name.
const NOT_NAME =
  /\b(tax\s*invoice|sales\s*(tax\s*)?invoice|invoice|receipt|cash\s*memo|bill|welcome|thank|customer|copy|duplicate|date|time|tel|phone|ph|fax|mob(ile)?|email|www\.|https?:|ntn|strn|gst|vat|address|cashier)\b/i;

/** The shop's name is usually one of the first readable lines. Always offered for checking. */
export function findMerchant(text: string): Found | undefined {
  const lines = text
    .split("\n")
    .map((line) => line.replace(/[|_=*~]+/g, " ").replace(/\s+/g, " ").trim())
    .slice(0, 6);

  const name = lines.find((line) => {
    const letters = line.replace(/[^A-Za-z]/g, "").length;
    return letters >= 3 && letters / line.length > 0.6 && !NOT_NAME.test(line);
  });
  return name ? { value: titleCase(name), confidence: 0.6 } : undefined;
}

/** Receipts shout; "HI-FI ELECTRONICS" reads better as "Hi-Fi Electronics". */
function titleCase(line: string): string {
  if (line !== line.toUpperCase()) return line;
  return line.toLowerCase().replace(/\b[a-z]/g, (letter) => letter.toUpperCase());
}
