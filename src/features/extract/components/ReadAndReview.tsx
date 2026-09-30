"use client";

import { useEffect, useState } from "react";
import { getPurchase } from "@/features/purchases/lib/purchases";
import type { Purchase } from "@/lib/db/types";
import { extractDocument } from "../lib/extract";
import { ReadTimeoutError } from "../lib/reader";
import { suggestionsFrom, type Suggestions } from "../lib/review";
import { ReviewForm } from "./ReviewForm";
import { UploadedDocument } from "./UploadedDocument";

type Props = {
  purchaseId: string;
  documentId: string;
  onDone: (purchaseId: string) => void;
  /** The user removed the photo to choose another; resolves once it's gone. */
  onDiscard: () => Promise<void>;
};

type State =
  | { step: "reading"; progress: number }
  | { step: "review"; purchase: Purchase; suggestions: Suggestions; notice?: string };

const COULD_NOT_READ = "We couldn't read this one — that's fine. Your photo is saved; fill in what you know.";
const TOOK_TOO_LONG = "Reading was taking too long, so we stopped. Your photo is saved; fill in what you know.";

/** Reads the saved document, then shows the review form. Every failure ends in the form (FR-46). */
export function ReadAndReview({ purchaseId, documentId, onDone, onDiscard }: Props) {
  const [state, setState] = useState<State>({ step: "reading", progress: 0 });
  const [skipped, setSkipped] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);

  async function remove() {
    setRemoving(true);
    setRemoveFailed(false);
    try {
      await onDiscard();
    } catch (error) {
      console.error("Could not remove the photo", error);
      setRemoveFailed(true);
      setRemoving(false);
    }
  }

  useEffect(() => {
    let active = true;
    const review = async (suggestions: Suggestions, notice?: string) => {
      const purchase = await getPurchase(purchaseId);
      if (active && purchase) setState({ step: "review", purchase, suggestions, notice });
    };

    if (skipped) {
      review({});
    } else {
      extractDocument(documentId, (progress) => active && setState({ step: "reading", progress }))
        .then((extraction) => review(suggestionsFrom(extraction.fields)))
        .catch((error) => {
          console.warn("Reading failed; switching to manual entry", error);
          review({}, error instanceof ReadTimeoutError ? TOOK_TOO_LONG : COULD_NOT_READ);
        });
    }
    return () => {
      active = false;
    };
  }, [purchaseId, documentId, skipped]);

  return (
    <div className="flex flex-col gap-5">
      <UploadedDocument documentId={documentId} removing={removing} onRemove={remove} />
      {removeFailed && (
        <p role="alert" className="text-danger">
          The photo couldn&apos;t be removed. Please try again.
        </p>
      )}
      {state.step === "review" ? (
        <ReviewForm purchase={state.purchase} suggestions={state.suggestions} notice={state.notice} onSaved={onDone} />
      ) : (
        <Reading progress={state.progress} onSkip={() => setSkipped(true)} />
      )}
    </div>
  );
}

function Reading({ progress, onSkip }: { progress: number; onSkip: () => void }) {
  const percent = Math.round(progress * 100);
  return (
    <div className="flex flex-col gap-4" aria-live="polite">
      <p className="text-lg font-medium">Reading your receipt…</p>
      <progress value={percent} max={100} aria-label="Reading progress" className="w-full" />
      <p className="text-sm text-muted">Your photo is already saved on this device.</p>
      <button type="button" onClick={onSkip} className="self-start rounded-card border border-line px-4 py-2 hover:bg-surface">
        Skip — enter details myself
      </button>
    </div>
  );
}
