import type { PurchaseField } from "@/lib/db/types";
import { FIELD_LIMITS } from "@/lib/sync/schema";

export type FieldInput = "text" | "date" | "amount" | "multiline";

export type FieldConfig = { field: PurchaseField; label: string; input: FieldInput; maxLength?: number };

/** Room for thousands separators around the longest amount the backup stores. */
const AMOUNT_MAX_LENGTH = 20;

// Order follows how people recall a purchase: what, where, when, how much, identifiers (FR-15, FR-16).
// Title is edited separately as the page heading.
export const PURCHASE_FIELDS: FieldConfig[] = [
  { field: "productName", label: "Product", input: "text", maxLength: FIELD_LIMITS.productName },
  { field: "merchant", label: "Store", input: "text", maxLength: FIELD_LIMITS.merchant },
  { field: "purchaseDate", label: "Purchase date", input: "date" },
  { field: "amount", label: "Amount", input: "amount", maxLength: AMOUNT_MAX_LENGTH },
  { field: "currency", label: "Currency", input: "text", maxLength: FIELD_LIMITS.currency },
  { field: "model", label: "Model", input: "text", maxLength: FIELD_LIMITS.model },
  { field: "serial", label: "Serial number", input: "text", maxLength: FIELD_LIMITS.serial },
  { field: "reference", label: "Invoice or order number", input: "text", maxLength: FIELD_LIMITS.reference },
  { field: "notes", label: "Notes", input: "multiline", maxLength: FIELD_LIMITS.notes },
];
