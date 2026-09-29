"use client";

import { useEffect, useState } from "react";
import { loadSignInSetup, type SignInSetup } from "../lib/authClient";

type Props = { error?: string };

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
          That sign-in link didn&apos;t work — it may have expired. Enter your email to get a new one.
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
