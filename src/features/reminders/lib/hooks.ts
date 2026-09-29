"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { listUpcoming } from "./reminders";

export function useUpcoming() {
  return useLiveQuery(() => listUpcoming(), []);
}
