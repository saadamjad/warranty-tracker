"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { PurchaseDetail } from "@/features/purchases/components/PurchaseDetail";

export default function PurchasePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <Suspense>
        <PurchaseFromQuery />
      </Suspense>
    </main>
  );
}

function PurchaseFromQuery() {
  const id = useSearchParams().get("id") ?? "";
  return <PurchaseDetail key={id} id={id} />;
}
