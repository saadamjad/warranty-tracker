"use client";

import Link from "next/link";
import { useState } from "react";
import type { VaultDocument } from "@/lib/db/types";
import { DOCUMENT_TYPE_LABELS, removeDocument, setDocumentType } from "../lib/documents";
import { useDocuments } from "../lib/hooks";
import { DocumentTypePicker } from "./DocumentTypePicker";
import { DocumentViewer } from "./DocumentViewer";

/** Every document of a purchase in one place (FR-13, FR-23, AC-5). */
export function DocumentsSection({ purchaseId }: { purchaseId: string }) {
  const documents = useDocuments(purchaseId);

  return (
    <section aria-labelledby="documents-heading" className="flex flex-col gap-3">
      <h2 id="documents-heading" className="text-lg font-semibold">
        Documents
      </h2>
      {documents.status === "ready" && documents.value.length === 0 && (
        <p className="text-muted">No documents yet. Add the receipt, invoice or warranty card.</p>
      )}
      {documents.status === "ready" &&
        documents.value.map((document) => <DocumentItem key={document.id} document={document} />)}
      <Link
        href={`/add?to=${purchaseId}`}
        className="self-start rounded-card border border-line px-4 py-2 font-medium hover:bg-surface"
      >
        + Add document
      </Link>
    </section>
  );
}

function DocumentItem({ document }: { document: VaultDocument }) {
  const [open, setOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const label = DOCUMENT_TYPE_LABELS[document.type];
  const pages = document.pageCount === 1 ? "1 page" : `${document.pageCount} pages`;

  return (
    <article className="rounded-card border border-line p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="font-medium hover:underline">
          {open ? "Hide" : "View"} {label.toLowerCase()} · {pages}
        </button>
        <div className="ml-auto">
          <DocumentTypePicker label="Type" value={document.type} onChange={(type) => setDocumentType(document.id, type)} />
        </div>
      </div>

      {open && (
        <div className="mt-3 flex flex-col gap-3">
          <DocumentViewer document={document} />
          {confirmRemove ? (
            <div role="alertdialog" aria-label="Remove document?" className="flex flex-wrap items-center gap-3">
              <span>Remove this {label.toLowerCase()} from the purchase?</span>
              <button type="button" onClick={() => removeDocument(document.id)} className="rounded-card bg-danger px-3 py-2 text-on-primary">
                Remove
              </button>
              <button type="button" onClick={() => setConfirmRemove(false)} className="rounded-card border border-line px-3 py-2">
                Cancel
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => setConfirmRemove(true)} className="self-start text-sm text-danger hover:underline">
              Remove document
            </button>
          )}
        </div>
      )}
    </article>
  );
}
