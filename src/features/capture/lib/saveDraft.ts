import { addDocument, type NewPage } from "@/features/documents/lib/documents";
import { hashPages } from "@/features/documents/lib/hash";
import { MAX_PAGES } from "@/features/documents/lib/limits";
import { pdfPageCount } from "@/features/documents/lib/pdf";
import { createPurchase } from "@/features/purchases/lib/purchases";
import type { DocumentType } from "@/lib/db/types";
import { isPdfDraft, type Draft } from "./draft";
import { enhanceImage } from "./enhance";

export class DraftError extends Error {}

type SaveInput = { draft: Draft; type: DocumentType; /** Attach to this purchase instead of a new one (FR-36). */ purchaseId?: string };

/**
 * Saves the draft as one document. Readable copies are made first, so a failure never
 * leaves an empty purchase behind.
 */
export async function saveDraft({ draft, type, purchaseId }: SaveInput): Promise<{ purchaseId: string; documentId: string }> {
  if (draft.pages.length === 0) throw new DraftError("Add a photo or file first.");

  const { pages, pageCount } = isPdfDraft(draft) ? await pdfPages(draft) : await photoPages(draft);
  const targetId = purchaseId ?? (await createPurchase()).id;
  const document = await addDocument({ purchaseId: targetId, type, pages, pageCount });
  return { purchaseId: targetId, documentId: document.id };
}

async function photoPages(draft: Draft): Promise<{ pages: NewPage[]; pageCount?: number }> {
  const pages = await Promise.all(
    draft.pages.map(async ({ file, turns }) => ({
      original: file,
      enhanced: await enhanceImage(file, turns),
      mimeType: file.type,
    })),
  );
  return { pages };
}

async function pdfPages(draft: Draft): Promise<{ pages: NewPage[]; pageCount?: number }> {
  const file = draft.pages[0].file;
  // An unreadable PDF (e.g. password-protected) is still kept as-is (rule 5).
  const pageCount = await pdfPageCount(file).catch(() => 1);
  if (pageCount > MAX_PAGES) {
    throw new DraftError(`This PDF has ${pageCount} pages; a document can have up to ${MAX_PAGES}. Save the pages you need as a shorter PDF or as photos.`);
  }
  return { pages: [{ original: file, mimeType: file.type }], pageCount };
}

/** Same hash addDocument will store, so a draft can be checked for duplicates before saving (D-12). */
export function draftHash(draft: Draft): Promise<string> {
  return hashPages(draft.pages.map((page) => page.file));
}
