"use client";

import { useRouter } from "next/navigation";
import { useEffect, useReducer, useState } from "react";
import { DocumentTypePicker } from "@/features/documents/components/DocumentTypePicker";
import { DuplicateWarning } from "@/features/duplicates/components/DuplicateWarning";
import { purchasesWithSameFile } from "@/features/duplicates/lib/duplicates";
import { ReadAndReview } from "@/features/extract/components/ReadAndReview";
import { prepareOfflineReading } from "@/features/extract/lib/warmUp";
import { EnterDetailsButton } from "@/features/purchases/components/EnterDetailsButton";
import { deletePurchaseForever } from "@/features/purchases/lib/purchases";
import type { DocumentType, Purchase } from "@/lib/db/types";
import { purchaseHref } from "@/lib/routes";
import { draftReducer, emptyDraft, type Draft } from "../lib/draft";
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
  const [removedNote, setRemovedNote] = useState(false);
  const hasPages = draft.pages.length > 0;

  useEffect(() => {
    prepareOfflineReading().catch((error) => console.warn("Could not prepare offline reading", error));
  }, []);

  /**
   * New purchases are checked for a file saved before; the user decides what to do (D-12).
   * The button is disabled from the first tap, so a double tap can't save twice.
   */
  async function start() {
    setSaving(true);
    if (!purchaseId) {
      const matches = await sameFileAs(draft);
      if (matches.length > 0) {
        setSaving(false);
        return setSameFile(matches);
      }
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
      if (target) router.push(purchaseHref(target));
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

  /**
   * The user tapped × to use a different photo: the purchase made from this one is removed
   * for good (also from backup, if it got there) and capture starts over.
   */
  async function discard(purchaseToRemove: string) {
    await deletePurchaseForever(purchaseToRemove);
    dispatch({ type: "reset" });
    setSaved(undefined);
    setSaving(false);
    setRemovedNote(true);
  }

  if (saved) {
    return <ReadAndReview {...saved} onDone={(id) => router.push(purchaseHref(id))} onDiscard={() => discard(saved.purchaseId)} />;
  }

  const message = saveError ?? draft.message;
  const saveLabel = purchaseId ? "Add to purchase" : "Continue";

  return (
    <div className="flex flex-col gap-5">
      <CaptureButtons hasPages={hasPages} onFiles={(files) => dispatch({ type: "add", files, makeId: () => crypto.randomUUID() })} />
      <p className="text-sm text-muted">Any photo is fine — you can check and fix the details next.</p>
      {removedNote && !hasPages && (
        <p role="status" className="text-sm">
          Photo removed. Take or choose another.
        </p>
      )}

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

/** The duplicate check only advises (D-12): if it fails, saving goes ahead. */
async function sameFileAs(draft: Draft): Promise<Purchase[]> {
  try {
    return await purchasesWithSameFile(await draftHash(draft));
  } catch (error) {
    console.warn("Could not check for a file saved before", error);
    return [];
  }
}
