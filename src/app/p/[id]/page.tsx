import Link from "next/link";
import { PurchaseDetail } from "@/features/purchases/components/PurchaseDetail";

export default async function PurchasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <PurchaseDetail id={id} />
    </main>
  );
}
