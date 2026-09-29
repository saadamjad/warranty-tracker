import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { serverEnv } from "./env";
import { prisma } from "./prisma";
import { recentSignInLinks } from "./repo";

/** Sign-in links are valid for a day (Auth.js default). */
const LINK_LIFETIME_MS = 24 * 60 * 60 * 1000;
/** At most this many sign-in emails per address per window, so the form can't be used to spam someone. */
const MAX_LINKS = 3;
const WINDOW_MINUTES = 10;

export class TooManySignInEmails extends Error {}

function rateLimited(send: NodemailerConfig["sendVerificationRequest"]): NodemailerConfig["sendVerificationRequest"] {
  return async (params) => {
    // Auth.js stores the new link while sending, so count only earlier ones.
    if ((await recentSignInLinks(params.identifier, WINDOW_MINUTES, LINK_LIFETIME_MS)) >= MAX_LINKS) {
      throw new TooManySignInEmails(`Too many sign-in emails for one address`);
    }
    await send(params);
  };
}

function authConfig(): NextAuthConfig {
  const env = serverEnv();

  const provider = env.SMTP_HOST
    ? Nodemailer({
        server: {
          host: env.SMTP_HOST,
          port: env.SMTP_PORT,
          auth: { user: env.SMTP_USER, pass: env.SMTP_PASSWORD },
        },
        from: env.EMAIL_FROM,
      })
    : Nodemailer({
        // No SMTP in local dev (D-21): print the sign-in link instead of sending it.
        server: { jsonTransport: true },
        from: env.EMAIL_FROM,
        sendVerificationRequest: ({ identifier, url }) => {
          console.info(`\nSign-in link for ${identifier}:\n${url}\n`);
        },
      });

  const email = { ...provider, sendVerificationRequest: rateLimited(provider.sendVerificationRequest) };
  // Auth.js reads user overrides from `options`; keep both in step.
  email.options = { ...provider.options, sendVerificationRequest: email.sendVerificationRequest };

  const google = env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET ? [Google] : [];

  return {
    adapter: PrismaAdapter(prisma),
    secret: env.AUTH_SECRET,
    providers: [email, ...google],
    pages: { signIn: "/signin", verifyRequest: "/signin/sent", error: "/signin" },
    callbacks: {
      // Sync needs the user's id. Only these fields reach the browser — never the session token.
      session: ({ session, user }) => ({
        expires: session.expires,
        user: { id: user.id, email: user.email, name: user.name, image: user.image },
      }),
    },
    // Host header is trusted on Vercel and in local dev; required outside Vercel by Auth.js v5.
    trustHost: true,
  };
}

// Config is built per request so `next build` doesn't need server secrets.
export const { handlers, auth, signIn, signOut } = NextAuth(() => authConfig());
