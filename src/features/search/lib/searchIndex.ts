import MiniSearch, { type SearchResult } from "minisearch";
import { displayTitle } from "@/features/purchases/lib/display";
import type { Purchase, VaultDocument } from "@/lib/db/types";

// One search entry per purchase, including the text read from all its documents, so a
// match anywhere leads to the purchase (FR-21, EC-02).

const FIELDS = ["title", "productName", "model", "serial", "merchant", "reference", "notes", "year", "documentText"] as const;
type Field = (typeof FIELDS)[number];

export type SearchEntry = { id: string } & Partial<Record<Field, string>>;

export const FIELD_LABELS: Record<Field, string> = {
  title: "Name",
  productName: "Product",
  model: "Model",
  serial: "Serial number",
  merchant: "Store",
  reference: "Invoice or order number",
  notes: "Notes",
  year: "Year",
  documentText: "Document text",
};

export function toEntries(purchases: Purchase[], documents: VaultDocument[]): SearchEntry[] {
  const textByPurchase = new Map<string, string[]>();
  for (const document of documents) {
    if (document.deletedAt || !document.ocrText) continue;
    textByPurchase.set(document.purchaseId, [...(textByPurchase.get(document.purchaseId) ?? []), document.ocrText]);
  }

  return purchases
    .filter((purchase) => !purchase.deletedAt)
    .map((purchase) => ({
      id: purchase.id,
      title: displayTitle(purchase),
      productName: purchase.productName,
      model: purchase.model,
      serial: purchase.serial,
      merchant: purchase.merchant,
      reference: purchase.reference,
      notes: purchase.notes,
      year: purchase.purchaseDate?.slice(0, 4),
      documentText: textByPurchase.get(purchase.id)?.join("\n"),
    }));
}

export function buildIndex(entries: SearchEntry[]): MiniSearch<SearchEntry> {
  const index = new MiniSearch<SearchEntry>({
    fields: [...FIELDS],
    storeFields: [...FIELDS],
    searchOptions: {
      // Forgiving: typos, partial words and misread letters still match (FR-22).
      fuzzy: typoAllowance,
      prefix: true,
      boost: { title: 3, productName: 3, merchant: 2, model: 2, serial: 2, reference: 2, documentText: 0.5 },
    },
  });
  index.addAll(entries);
  return index;
}

/**
 * Edits allowed per word: none for short words or numbers (a year or serial must be exact),
 * one for 4–5 letters, two for longer words so swapped letters ("kettel") still match.
 */
export function typoAllowance(term: string): number {
  if (term.length < 4 || /^\d+$/.test(term)) return 0;
  return term.length <= 5 ? 1 : 2;
}

export type SearchHit = { id: string; title: string; field: string; snippet: string };

/** All words should match; if that finds nothing, any word will do. */
export function search(index: MiniSearch<SearchEntry>, query: string): SearchHit[] {
  const trimmed = query.trim();
  if (!trimmed) return [];
  const strict = index.search(trimmed, { combineWith: "AND" });
  const results = strict.length ? strict : index.search(trimmed, { combineWith: "OR" });
  return results.map(toHit);
}

/** Where it matched, so the user sees why this purchase came up (§6). */
function toHit(result: SearchResult): SearchHit {
  const matched = new Set(Object.values(result.match).flat() as Field[]);
  const field = FIELDS.find((name) => matched.has(name) && name !== "title") ?? "title";
  const value = String(result[field] ?? "");
  return { id: result.id, title: String(result.title), field: FIELD_LABELS[field], snippet: snippetOf(value, result.terms) };
}

const SNIPPET_LENGTH = 80;

function snippetOf(value: string, terms: string[]): string {
  const lines = value.split("\n");
  const line = lines.find((text) => terms.some((term) => text.toLowerCase().includes(term))) ?? lines[0];
  const trimmed = line.trim();
  return trimmed.length > SNIPPET_LENGTH ? `${trimmed.slice(0, SNIPPET_LENGTH)}…` : trimmed;
}
