"use client";

import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { getDocument, getPages, listDocuments } from "./documents";

export function useDocuments(purchaseId: string) {
  return useLiveQuery(() => listDocuments(purchaseId), [purchaseId]);
}

export function usePages(documentId: string) {
  return useLiveQuery(() => getPages(documentId), [documentId]);
}

export function useDocument(id: string) {
  return useLiveQuery(() => getDocument(id), [id]);
}
