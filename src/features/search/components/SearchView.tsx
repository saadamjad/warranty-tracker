"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearch } from "../lib/hooks";
import { SearchBox } from "./SearchBox";

export function SearchView({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);
  const { ready, hits } = useSearch(query);

  function update(next: string) {
    setQuery(next);
    // Keeps the address shareable/back-button friendly without re-rendering the page.
    window.history.replaceState(null, "", next ? `/search?q=${encodeURIComponent(next)}` : "/search");
  }

  return (
    <div className="flex flex-col gap-4">
      <SearchBox defaultValue={initialQuery} onQuery={update} autoFocus />
      <Results ready={ready} query={query} hits={hits} />
    </div>
  );
}

function Results({ ready, query, hits }: { ready: boolean; query: string; hits: ReturnType<typeof useSearch>["hits"] }) {
  if (!query.trim()) return <p className="text-muted">Try a product, store, model, year, or a word from the receipt.</p>;
  if (!ready) return <p className="text-muted">Searching…</p>;
  if (hits.length === 0) {
    return <p className="text-muted">Nothing matches &ldquo;{query}&rdquo;. Try fewer or different words — the store name or the year often helps.</p>;
  }

  return (
    <ul className="divide-y divide-line" aria-label="Search results">
      {hits.map((hit) => (
        <li key={hit.id}>
          <Link href={`/p/${hit.id}`} className="block py-3 hover:bg-surface">
            <span className="block font-medium">{hit.title}</span>
            <span className="block text-sm text-muted">
              {hit.field}: {hit.snippet}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
