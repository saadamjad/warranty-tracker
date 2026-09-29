"use client";

import Link from "next/link";
import { useState } from "react";
import { DocumentsSection } from "@/features/documents/components/DocumentsSection";
import { RemindersToggle } from "@/features/reminders/components/RemindersToggle";
import { ReturnSection } from "@/features/warranty/components/ReturnSection";
import { WarrantySection } from "@/features/warranty/components/WarrantySection";
import type { Purchase, PurchaseFields } from "@/lib/db/types";
import { displayTitle } from "../lib/display";
import { PURCHASE_FIELDS } from "../lib/fieldConfig";
import { usePurchase } from "../lib/hooks";
import { restorePurchase, updatePurchase } from "../lib/purchases";
import { DeletePurchase } from "./DeletePurchase";
import { EditableField } from "./EditableField";

export function PurchaseDetail({ id }: { id: string }) {
  const result = usePurchase(id);

  if (result.status === "loading") return <p className="text-muted">Loading…</p>;
  if (result.status === "error" || !result.value) return <NotFound />;
  return <PurchaseForm purchase={result.value} />;
}

function NotFound() {
  return (
    <div role="alert">
      <p>We couldn&apos;t find this purchase on this device.</p>
      <Link href="/" className="mt-2 inline-block text-primary hover:underline">
        Go to your purchases
      </Link>
    </div>
  );
}

function PurchaseForm({ purchase }: { purchase: Purchase }) {
  const [saveFailed, setSaveFailed] = useState(false);

  async function save(edits: PurchaseFields) {
    try {
      await updatePurchase(purchase.id, edits);
      setSaveFailed(false);
    } catch (error) {
      console.error("Could not save purchase edit", error);
      setSaveFailed(true);
    }
  }

  return (
    <article className="flex flex-col gap-5">
      {purchase.deletedAt && <DeletedBanner id={purchase.id} />}

      <label className="block">
        <span className="sr-only">Purchase name</span>
        <input
          key={purchase.title ?? ""}
          defaultValue={purchase.title ?? ""}
          placeholder={displayTitle(purchase)}
          onBlur={(event) => {
            if (event.target.value !== (purchase.title ?? "")) save({ title: event.target.value });
          }}
          className="w-full rounded-card bg-transparent px-1 text-2xl font-bold placeholder:text-foreground hover:bg-surface focus:bg-surface"
        />
      </label>

      {saveFailed && (
        <p role="alert" className="text-danger">
          That change wasn&apos;t saved. Please try again.
        </p>
      )}

      {!purchase.deletedAt && <DocumentsSection purchaseId={purchase.id} />}

      {PURCHASE_FIELDS.map(({ field, label, input }) => (
        <EditableField
          key={field}
          label={label}
          input={input}
          value={purchase[field]}
          onSave={(value) => save({ [field]: value })}
        />
      ))}

      {!purchase.deletedAt && (
        <>
          <WarrantySection purchase={purchase} />
          <ReturnSection purchase={purchase} />
          <RemindersToggle purchase={purchase} />
          <DeletePurchase id={purchase.id} />
        </>
      )}
    </article>
  );
}

function DeletedBanner({ id }: { id: string }) {
  return (
    <div role="status" className="flex items-center justify-between gap-4 rounded-card bg-surface p-4">
      <p>This purchase is in Recently Deleted.</p>
      <button
        type="button"
        onClick={() => restorePurchase(id)}
        className="rounded-card bg-primary px-4 py-2 font-medium text-on-primary hover:bg-primary-hover"
      >
        Restore
      </button>
    </div>
  );
}
