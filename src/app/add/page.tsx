import Link from "next/link";
import { EnterDetailsButton } from "@/features/purchases/components/EnterDetailsButton";

export default function AddPurchasePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">Add a purchase</h1>
      <EnterDetailsButton />
    </main>
  );
}
