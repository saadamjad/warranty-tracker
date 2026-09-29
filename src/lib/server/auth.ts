import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth, { type NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { serverEnv } from "./env";
import { prisma } from "./prisma";

function authConfig(): NextAuthConfig {
  const env = serverEnv();

  const email = env.SMTP_HOST
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

  const google = env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET ? [Google] : [];

  return {
    adapter: PrismaAdapter(prisma),
    secret: env.AUTH_SECRET,
    providers: [email, ...google],
    pages: { signIn: "/signin" },
  };
}

// Config is built per request so `next build` doesn't need server secrets.
export const { handlers, auth, signIn, signOut } = NextAuth(() => authConfig());
