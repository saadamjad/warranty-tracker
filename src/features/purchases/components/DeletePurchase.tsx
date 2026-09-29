"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLiveQuery } from "@/lib/db/useLiveQuery";
import { deleteMessage } from "../lib/display";
import { countDocuments, softDeletePurchase } from "../lib/purchases";

export function DeletePurchase({ id }: { id: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [failed, setFailed] = useState(false);
  const documents = useLiveQuery(() => countDocuments(id), [id]);

  async function confirmDelete() {
    try {
      await softDeletePurchase(id);
      router.push("/");
    } catch (error) {
      console.error("Could not delete purchase", error);
      setFailed(true);
    }
  }

  if (!confirming) {
    return (
      <button type="button" onClick={() => setConfirming(true)} className="self-start text-danger hover:underline">
        Delete purchase
      </button>
    );
  }

  const count = documents.status === "ready" ? documents.value : 0;

  return (
    <div role="alertdialog" aria-labelledby="delete-title" className="rounded-card border border-danger p-4">
      <p id="delete-title" className="font-medium">
        Delete this purchase?
      </p>
      <p className="mt-1 text-muted">{deleteMessage(count)}</p>
      {failed && (
        <p role="alert" className="mt-2 text-danger">
          It couldn&apos;t be deleted right now. Please try again.
        </p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={confirmDelete}
          disabled={documents.status === "loading"}
          className="rounded-card bg-danger px-4 py-2 font-medium text-on-primary hover:bg-danger-hover disabled:opacity-60"
        >
          Delete
        </button>
        <button type="button" onClick={() => setConfirming(false)} className="rounded-card border border-line px-4 py-2">
          Cancel
        </button>
      </div>
    </div>
  );
}
