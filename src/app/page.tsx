import Link from "next/link";
import { BackupPrompt } from "@/features/account/components/BackupPrompt";
import { OfflineNote } from "@/features/offline/components/OfflineNote";
import { RecentPurchases } from "@/features/purchases/components/RecentPurchases";
import { ComingUp } from "@/features/reminders/components/ComingUp";
import { SearchBox } from "@/features/search/components/SearchBox";
import { BackupStatus } from "@/features/sync/components/BackupStatus";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold">Purchase Vault</h1>
        <p className="mt-2 text-lg text-muted">Save it now. Find it later.</p>
        <div className="mt-2">
          <BackupStatus />
        </div>
      </header>

      <OfflineNote />

      <Link
        href="/add"
        className="rounded-card bg-primary px-6 py-4 text-center text-lg font-semibold text-on-primary hover:bg-primary-hover"
      >
        + Add Purchase
      </Link>

      <SearchBox />

      <ComingUp />

      <BackupPrompt />

      <RecentPurchases />

      <footer className="mt-auto flex flex-col gap-2 text-sm text-muted">
        <p>Everything stays on this device unless you choose to back it up.</p>
        <Link href="/settings" className="hover:underline">
          Settings
        </Link>
      </footer>
    </main>
  );
}
