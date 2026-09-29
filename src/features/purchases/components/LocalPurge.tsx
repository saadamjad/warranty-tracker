"use client";

import { useEffect } from "react";
import { purgeExpiredLocally } from "../lib/purge";

/** Clears items older than Recently Deleted's 30 days whenever the app opens (D-29). */
export function LocalPurge() {
  useEffect(() => {
    purgeExpiredLocally().catch((error) => console.warn("Could not clear old deleted items", error));
  }, []);
  return null;
}
