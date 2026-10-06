import { NextResponse, type NextRequest } from "next/server";
import { handlers } from "@/lib/server/auth";
import { clientIp, isRateLimited } from "@/lib/server/rateLimit";

export const { GET } = handlers;

// The per-address limit lives in auth.ts; this one stops a single sender cycling through
// many addresses. It answers like any refused sign-in so the form shows plain words.
export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const isEmailSignIn = request.nextUrl.pathname.endsWith("/signin/nodemailer");
  if (ip && isEmailSignIn && (await isRateLimited("signInIp", ip))) {
    return NextResponse.redirect(new URL("/signin?error=TooMany", request.url), 303);
  }
  return handlers.POST(request);
}
