"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SignInForm } from "@/features/account/components/SignInForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <h1 className="text-2xl font-bold">Back up your purchases</h1>
      <p className="text-muted">
        Sign in to keep a copy of your purchases and documents safe, and to get them back on a new phone or computer.
        Everything keeps working without an account.{" "}
        <Link href="/privacy" className="text-primary underline">
          How is my data kept?
        </Link>
      </p>
      <Suspense>
        <SignInFromQuery />
      </Suspense>
    </main>
  );
}

function SignInFromQuery() {
  const params = useSearchParams();
  return <SignInForm error={params.get("error") ?? undefined} />;
}
