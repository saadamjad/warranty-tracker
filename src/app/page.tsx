export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <header>
        <h1 className="text-3xl font-bold">Purchase Vault</h1>
        <p className="mt-2 text-lg text-gray-600 dark:text-gray-300">
          Save it now. Find it later.
        </p>
      </header>

      <button
        type="button"
        className="rounded-xl bg-blue-600 px-6 py-4 text-lg font-semibold text-white hover:bg-blue-700"
      >
        + Add Purchase
      </button>

      <input
        type="search"
        placeholder="Search by product, store, or anything you remember"
        className="rounded-xl border border-gray-300 px-4 py-3 dark:border-gray-700 dark:bg-gray-900"
      />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Recent purchases
        </h2>
        <p className="mt-3 text-gray-500">
          Nothing saved yet. Your receipts, warranties and invoices will appear here.
        </p>
      </section>

      <footer className="mt-auto text-sm text-gray-500">
        Everything stays on this device unless you choose to back it up.
      </footer>
    </main>
  );
}
