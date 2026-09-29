"use client";

import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { DocumentTypePicker } from "@/features/documents/components/DocumentTypePicker";
import { DuplicateWarning } from "@/features/duplicates/components/DuplicateWarning";
import { purchasesWithSameFile } from "@/features/duplicates/lib/duplicates";
import { ReadAndReview } from "@/features/extract/components/ReadAndReview";
import { EnterDetailsButton } from "@/features/purchases/components/EnterDetailsButton";
import type { DocumentType, Purchase } from "@/lib/db/types";
import { draftReducer, emptyDraft } from "../lib/draft";
import { DraftError, draftHash, saveDraft } from "../lib/saveDraft";
import { CaptureButtons } from "./CaptureButtons";
import { PageList } from "./PageList";

type Props = { /** Adding a document to an existing purchase (FR-36). */ purchaseId?: string };

export function CaptureFlow({ purchaseId }: Props) {
  const router = useRouter();
  const [draft, dispatch] = useReducer(draftReducer, emptyDraft);
  const [type, setType] = useState<DocumentType>(purchaseId ? "warranty" : "receipt");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [saved, setSaved] = useState<{ purchaseId: string; documentId: string }>();
  const [sameFile, setSameFile] = useState<Purchase[]>([]);
  const hasPages = draft.pages.length > 0;

  /** New purchases are checked for a file saved before; the user decides what to do (D-12). */
  async function start() {
    if (!purchaseId) {
      const matches = await purchasesWithSameFile(await draftHash(draft)).catch(() => []);
      if (matches.length > 0) return setSameFile(matches);
    }
    await save(purchaseId);
  }

  async function save(target: string | undefined) {
    setSameFile([]);
    setSaving(true);
    setSaveError(undefined);
    try {
      const result = await saveDraft({ draft, type, purchaseId: target });
      // A document added to an existing purchase goes straight back to it.
      if (target) router.push(`/p/${target}`);
      else setSaved(result);
    } catch (error) {
      console.error("Could not save document", error);
      setSaveError(
        error instanceof DraftError
          ? error.message
          : "This device couldn't save right now. Check that your browser allows site storage, then try again.",
      );
      setSaving(false);
    }
  }

  if (saved) {
    return <ReadAndReview {...saved} onDone={(id) => router.push(`/p/${id}`)} />;
  }

  const message = saveError ?? draft.message;
  const saveLabel = purchaseId ? "Add to purchase" : "Continue";

  return (
    <div className="flex flex-col gap-5">
      <CaptureButtons hasPages={hasPages} onFiles={(files) => dispatch({ type: "add", files, makeId: () => crypto.randomUUID() })} />
      <p className="text-sm text-muted">Any photo is fine — you can check and fix the details next.</p>

      {message && (
        <p role="alert" className="rounded-card bg-attention-surface p-3">
          {message}
        </p>
      )}

      {hasPages && (
        <>
          <p role="status">
            {draft.pages.length === 1 ? "1 page added." : `${draft.pages.length} pages added.`} Long receipt? Add
            each part as another page.
          </p>
          <PageList pages={draft.pages} dispatch={dispatch} />
          <DocumentTypePicker value={type} onChange={setType} />
          {sameFile.length > 0 && (
            <DuplicateWarning
              reason="same-file"
              matches={sameFile}
              onSaveAnyway={() => save(undefined)}
              onAddToExisting={(existing) => save(existing.id)}
              onCancel={() => setSameFile([])}
            />
          )}
          <button
            type="button"
            onClick={start}
            disabled={saving}
            className="rounded-card bg-primary px-6 py-4 text-lg font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : saveLabel}
          </button>
        </>
      )}

      {!purchaseId && (
        <div className="border-t border-line pt-5">
          <p className="mb-2 text-sm text-muted">No receipt, or it&apos;s handwritten?</p>
          <EnterDetailsButton />
        </div>
      )}
    </div>
  );
}
