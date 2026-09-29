// What reading a document produces. Values are plain strings in the same formats as
// Purchase fields ('YYYY-MM-DD', decimal text), so they drop straight into the review form.

export type ExtractField =
  | "merchant"
  | "purchaseDate"
  | "amount"
  | "currency"
  | "reference"
  | "serial"
  | "model"
  /** Warranty length found on the receipt, e.g. "12"; used by the warranty section. */
  | "warrantyMonths";

export type Found = {
  value: string;
  /** 0..1 */
  confidence: number;
  /** Other plausible values; present means the user should choose (rule 4). */
  candidates?: string[];
};

export type ExtractedFields = Partial<Record<ExtractField, Found>>;

export type Extraction = { text: string; fields: ExtractedFields };

/** Below this, the review screen highlights the field for checking. */
export const CONFIDENT = 0.7;

export function needsCheck(found: Found | undefined): boolean {
  return Boolean(found && (found.confidence < CONFIDENT || found.candidates?.length));
}
