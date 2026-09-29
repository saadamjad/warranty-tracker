"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createPurchase } from "../lib/purchases";
import { purchaseHref } from "@/lib/routes";

/** Manual path that always works, with or without a document (FR-09, FR-46). */
export function EnterDetailsButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "saving" | "failed">("idle");

  async function start() {
    setState("saving");
    try {
      const purchase = await createPurchase();
      router.push(purchaseHref(purchase.id));
    } catch (error) {
      console.error("Could not create purchase", error);
      setState("failed");
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={start}
        disabled={state === "saving"}
        className="w-full rounded-card border border-line px-6 py-4 text-lg font-medium hover:bg-surface disabled:opacity-60"
      >
        Enter details myself
      </button>
      {state === "failed" && (
        <p role="alert" className="mt-2 text-danger">
          This device couldn&apos;t save right now. Check that your browser allows site storage, then try again.
        </p>
      )}
    </div>
  );
}
