"use client";

import { useEffect, useState } from "react";
import { loadSignInSetup, type SignInSetup } from "../lib/authClient";

type Props = { error?: string };

// Auth.js error codes → plain words. "Configuration" is also what a refused (too frequent) email gives.
const SIGN_IN_ERRORS: Record<string, string> = {
  Verification: "That sign-in link didn't work — it may have expired or been used. Enter your email to get a new one.",
  Configuration: "We couldn't send a sign-in email just now. If you asked for several, wait 10 minutes and try again.",
};

/**
 * Sign in to back up and restore (FR-28). Plain form posts to Auth.js, so it works without
 * extra client libraries. Offline, it explains that saving still works.
 */
export function SignInForm({ error }: Props) {
  const [email, setEmail] = useState("");
  const [setup, setSetup] = useState<SignInSetup | "offline">();

  useEffect(() => {
    loadSignInSetup().then(setSetup, () => setSetup("offline"));
  }, []);

  if (setup === "offline") {
    return (
      <p role="status">
        Signing in needs an internet connection. Your purchases are safe on this device — come back when you&apos;re
        online.
      </p>
    );
  }
  if (!setup) return <p className="text-muted">Loading…</p>;
  const { csrfToken, googleEnabled } = setup;

  return (
    <div className="flex flex-col gap-6">
      {error && (
        <p role="alert" className="text-danger">
          {SIGN_IN_ERRORS[error] ?? SIGN_IN_ERRORS.Verification}
        </p>
      )}
      <form method="post" action="/api/auth/signin/nodemailer" className="flex flex-col gap-3">
        <input type="hidden" name="csrfToken" value={csrfToken} />
        <input type="hidden" name="callbackUrl" value="/settings?backup=on" />
        <label htmlFor="email" className="font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-card border border-line bg-background px-4 py-3"
        />
        <button type="submit" className="rounded-card bg-primary px-6 py-3 font-semibold text-on-primary hover:bg-primary-hover">
          Email me a sign-in link
        </button>
      </form>
      {googleEnabled && (
        <form method="post" action="/api/auth/signin/google">
          <input type="hidden" name="csrfToken" value={csrfToken} />
          <input type="hidden" name="callbackUrl" value="/settings?backup=on" />
          <button type="submit" className="w-full rounded-card border border-line px-6 py-3 font-medium hover:bg-surface">
            Continue with Google
          </button>
        </form>
      )}
    </div>
  );
}
