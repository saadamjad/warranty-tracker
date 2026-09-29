import Link from "next/link";
import { CaptureFlow } from "@/features/capture/components/CaptureFlow";
import { purchaseHref } from "@/lib/routes";

type Props = { searchParams: Promise<{ to?: string }> };

export default async function AddPurchasePage({ searchParams }: Props) {
  const { to: purchaseId } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href={purchaseId ? purchaseHref(purchaseId) : "/"} className="text-primary hover:underline">
        ← Back
      </Link>
      <h1 className="text-2xl font-bold">{purchaseId ? "Add a document" : "Add a purchase"}</h1>
      <CaptureFlow purchaseId={purchaseId} />
    </main>
  );
}
