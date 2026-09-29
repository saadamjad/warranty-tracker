import Link from "next/link";
import { RecentPurchases } from "@/features/purchases/components/RecentPurchases";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold">Purchase Vault</h1>
        <p className="mt-2 text-lg text-muted">Save it now. Find it later.</p>
      </header>

      <Link
        href="/add"
        className="rounded-card bg-primary px-6 py-4 text-center text-lg font-semibold text-on-primary hover:bg-primary-hover"
      >
        + Add Purchase
      </Link>

      <RecentPurchases />

      <footer className="mt-auto text-sm text-muted">
        Everything stays on this device unless you choose to back it up.
      </footer>
    </main>
  );
}
