import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import type { NodemailerConfig } from "next-auth/providers/nodemailer";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { serverEnv } from "./env";
import { prisma } from "./prisma";
import { isRateLimited } from "./rateLimit";

/** Sign-in links expire after 30 minutes: long enough to switch to the inbox, short if one leaks. */
const LINK_LIFETIME_SECONDS = 30 * 60;

export class TooManySignInEmails extends Error {}

function rateLimited(send: NodemailerConfig["sendVerificationRequest"]): NodemailerConfig["sendVerificationRequest"] {
  return async (params) => {
    if (await isRateLimited("signInEmail", params.identifier.toLowerCase())) {
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
        maxAge: LINK_LIFETIME_SECONDS,
      })
    : Nodemailer({
        // No SMTP in local dev (D-21): print the sign-in link instead of sending it.
        server: { jsonTransport: true },
        from: env.EMAIL_FROM,
        maxAge: LINK_LIFETIME_SECONDS,
        sendVerificationRequest: ({ identifier, url }) => {
          console.info(`\nSign-in link for ${identifier}:\n${url}\n`);
        },
      });

  // Nodemailer() keeps a user-supplied sender in `options`; the top-level one is the library default.
  const send = provider.options?.sendVerificationRequest ?? provider.sendVerificationRequest;
  const email = { ...provider, sendVerificationRequest: rateLimited(send) };
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
