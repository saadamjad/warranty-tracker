import Link from "next/link";

export default function SignInSentPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-4 px-4 py-12">
      <h1 className="text-2xl font-bold">Check your email</h1>
      <p>We sent you a sign-in link. Open it on this device to turn on backup.</p>
      <p className="text-muted">Didn&apos;t get it? Check spam, or try again in a minute.</p>
      <Link href="/" className="text-primary hover:underline">
        Back to your purchases
      </Link>
    </main>
  );
}
