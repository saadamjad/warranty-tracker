"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { CaptureFlow } from "@/features/capture/components/CaptureFlow";
import { purchaseHref } from "@/lib/routes";

export default function AddPurchasePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Suspense>
        <AddFromQuery />
      </Suspense>
    </main>
  );
}

function AddFromQuery() {
  const purchaseId = useSearchParams().get("to") ?? undefined;
  return (
    <>
      <Link href={purchaseId ? purchaseHref(purchaseId) : "/"} className="text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{purchaseId ? "Add a document" : "Add a purchase"}</h1>
      <CaptureFlow key={purchaseId} purchaseId={purchaseId} />
    </>
  );
}
