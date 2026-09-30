"use client";

import { DocumentViewer } from "@/features/documents/components/DocumentViewer";
import { useDocument } from "@/features/documents/lib/hooks";

type Props = { documentId: string; removing: boolean; onRemove: () => void };

/** What the user just added, next to the details read from it, with a way to pick another. */
export function UploadedDocument({ documentId, removing, onRemove }: Props) {
  const document = useDocument(documentId);
  if (document.status !== "ready" || !document.value) return null;

  return (
    // Long receipts stay short here so the details are visible; "Open file" shows it in full.
    <section aria-label="Your photo" className="relative [&_img]:max-h-72 [&_img]:object-contain">
      <DocumentViewer document={document.value} />
      <button
        type="button"
        onClick={onRemove}
        disabled={removing}
        aria-label="Remove this photo and choose another"
        title="Remove this photo and choose another"
        className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full border border-line bg-background text-2xl leading-none shadow hover:bg-surface disabled:opacity-60"
      >
        <span aria-hidden="true">×</span>
      </button>
    </section>
  );
}
