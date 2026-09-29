"use client";

import { liveQuery } from "dexie";
import { useEffect, useState } from "react";

export type LiveResult<T> =
  | { status: "loading" }
  | { status: "ready"; value: T }
  | { status: "error"; error: unknown };

/**
 * Re-runs `query` whenever the tables it reads change, so screens stay current
 * after local edits. `deps` works like useEffect deps.
 */
export function useLiveQuery<T>(query: () => Promise<T>, deps: readonly unknown[]): LiveResult<T> {
  const [result, setResult] = useState<LiveResult<T>>({ status: "loading" });

  useEffect(() => {
    const subscription = liveQuery(query).subscribe({
      next: (value) => setResult({ status: "ready", value }),
      error: (error) => setResult({ status: "error", error }),
    });
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies deps, like useEffect
  }, deps);

  return result;
}
