"use client";

import { useMemo } from "react";
import { listAllDocuments } from "@/features/documents/lib/documents";
import { listPurchases } from "@/features/purchases/lib/purchases";
import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { buildIndex, search, toEntries } from "./searchIndex";

async function loadEntries() {
  const [purchases, documents] = await Promise.all([listPurchases(), listAllDocuments()]);
  return toEntries(purchases, documents);
}

/**
 * Search results that stay current: the index is rebuilt whenever local purchases or
 * documents change, which is fast at personal-vault sizes (FR-21).
 */
export function useSearch(query: string) {
  const entries = useLiveQuery(loadEntries, []);
  const index = useMemo(() => (entries.status === "ready" ? buildIndex(entries.value) : undefined), [entries]);
  const hits = useMemo(() => (index ? search(index, query) : []), [index, query]);
  return { ready: index !== undefined, hits };
}
