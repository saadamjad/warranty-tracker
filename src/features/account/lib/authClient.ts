// Small client helpers around Auth.js endpoints; no extra client library needed.

export type SignInSetup = { csrfToken: string; googleEnabled: boolean };

export async function loadSignInSetup(): Promise<SignInSetup> {
  const [csrf, providers] = await Promise.all([
    fetch("/api/auth/csrf").then((response) => response.json() as Promise<{ csrfToken: string }>),
    fetch("/api/auth/providers").then((response) => response.json() as Promise<Record<string, unknown>>),
  ]);
  return { csrfToken: csrf.csrfToken, googleEnabled: "google" in providers };
}

export type Account = { id: string; email: string };

/** The signed-in account, or null. Throws when the server can't be reached (e.g. offline). */
export async function fetchAccount(): Promise<Account | null> {
  const response = await fetch("/api/auth/session", { cache: "no-store" });
  if (!response.ok) throw new Error(`Session check failed: ${response.status}`);
  const session = (await response.json()) as { user?: { id?: string; email?: string } } | null;
  return session?.user?.id && session.user.email ? { id: session.user.id, email: session.user.email } : null;
}
