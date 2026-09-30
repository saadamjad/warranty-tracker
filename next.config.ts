import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // The app is never embedded in other sites (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Purchase ids in URLs must not leak to other sites through links.
          { key: "Referrer-Policy", value: "same-origin" },
          // Camera for receipts on this site only; nothing else (SPEC §7: no unrelated permissions).
          { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
      {
        // Browsers must always check for a new service worker, or fixes would never reach users.
        source: "/sw.js",
        headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
      },
    ];
  },
};

// `next dev` gets its own folder: running `next build` while the dev server is up used to
// overwrite its files and every page answered "Internal Server Error".
export default function config(phase: string): NextConfig {
  return phase === PHASE_DEVELOPMENT_SERVER ? { ...nextConfig, distDir: ".next-dev" } : nextConfig;
}
