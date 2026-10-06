// Content-Security-Policy for every page (CODING_STANDARDS §10). A header policy rather than
// per-request nonces: nonces would force every page to render on demand, and the offline
// page cache relies on prerendered pages. Inline scripts stay allowed because Next's
// prerendered pages need them; the rest still blocks plugins, framing, <base> hijacks, form
// posts to other sites, and any page data leaving for a host other than the app and the
// file storage bucket.

/** `storageEndpoint` is S3_ENDPOINT: browsers upload and restore files directly from it. */
export function contentSecurityPolicy({ storageEndpoint, dev }: { storageEndpoint?: string; dev: boolean }): string {
  const storage = storageEndpoint ? new URL(storageEndpoint).origin : "";
  const directives: Record<string, string> = {
    "default-src": "'self'",
    // 'wasm-unsafe-eval': on-device reading runs WebAssembly. Dev needs eval for fast refresh.
    "script-src": `'self' 'unsafe-inline' 'wasm-unsafe-eval'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src": "'self' 'unsafe-inline'",
    // blob:/data: are photos and PDF pages shown straight from this device.
    "img-src": `'self' blob: data: ${storage}`,
    "connect-src": `'self' ${storage}${dev ? " ws:" : ""}`,
    "worker-src": "'self' blob:",
    "font-src": "'self'",
    "object-src": "'none'",
    "base-uri": "'self'",
    "frame-ancestors": "'none'",
    // Google sign-in posts to our own route, which then redirects to Google.
    "form-action": "'self' https://accounts.google.com",
  };
  return Object.entries(directives)
    .map(([name, value]) => `${name} ${value}`.trim().replace(/\s+/g, " "))
    .join("; ");
}
