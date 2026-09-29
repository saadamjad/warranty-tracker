import Link from "next/link";
import { RecentlyDeleted } from "@/features/purchases/components/RecentlyDeleted";

export default function RecentlyDeletedPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <h1 className="text-2xl font-bold">Recently Deleted</h1>
      <RecentlyDeleted />
    </main>
  );
}
