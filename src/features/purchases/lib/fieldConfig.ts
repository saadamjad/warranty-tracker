import type { PurchaseField } from "@/lib/db/types";

export type FieldInput = "text" | "date" | "amount" | "multiline";

export type FieldConfig = { field: PurchaseField; label: string; input: FieldInput };

// Order follows how people recall a purchase: what, where, when, how much, identifiers (FR-15, FR-16).
// Title is edited separately as the page heading.
export const PURCHASE_FIELDS: FieldConfig[] = [
  { field: "productName", label: "Product", input: "text" },
  { field: "merchant", label: "Store", input: "text" },
  { field: "purchaseDate", label: "Purchase date", input: "date" },
  { field: "amount", label: "Amount", input: "amount" },
  { field: "currency", label: "Currency", input: "text" },
  { field: "model", label: "Model", input: "text" },
  { field: "serial", label: "Serial number", input: "text" },
  { field: "reference", label: "Invoice or order number", input: "text" },
  { field: "notes", label: "Notes", input: "multiline" },
];
