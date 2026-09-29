import Link from "next/link";
import { SearchView } from "@/features/search/components/SearchView";

type Props = { searchParams: Promise<{ q?: string }> };

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-6 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <h1 className="text-2xl font-bold">Search</h1>
      <SearchView initialQuery={q} />
    </main>
  );
}
