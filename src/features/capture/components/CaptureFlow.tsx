"use client";

import { useRouter } from "next/navigation";
import { useReducer, useState } from "react";
import { DocumentTypePicker } from "@/features/documents/components/DocumentTypePicker";
import { EnterDetailsButton } from "@/features/purchases/components/EnterDetailsButton";
import type { DocumentType } from "@/lib/db/types";
import { draftReducer, emptyDraft } from "../lib/draft";
import { DraftError, saveDraft } from "../lib/saveDraft";
import { CaptureButtons } from "./CaptureButtons";
import { PageList } from "./PageList";

type Props = { /** Adding a document to an existing purchase (FR-36). */ purchaseId?: string };

export function CaptureFlow({ purchaseId }: Props) {
  const router = useRouter();
  const [draft, dispatch] = useReducer(draftReducer, emptyDraft);
  const [type, setType] = useState<DocumentType>(purchaseId ? "warranty" : "receipt");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const hasPages = draft.pages.length > 0;

  async function save() {
    setSaving(true);
    setSaveError(undefined);
    try {
      const id = await saveDraft({ draft, type, purchaseId });
      router.push(`/p/${id}`);
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

  const message = saveError ?? draft.message;

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
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-card bg-primary px-6 py-4 text-lg font-semibold text-on-primary hover:bg-primary-hover disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
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
