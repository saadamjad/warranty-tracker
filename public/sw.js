// Offline support (FR-25, FR-26, D-33). Plain JS: served as-is from /sw.js.
// Pages are static shells, so caching each once lets the app open offline for any purchase.

const VERSION = "v3";
const PAGES = `pages-${VERSION}`;
const ASSETS = `assets-${VERSION}`;
const SHELL = ["/", "/add", "/p", "/search", "/settings", "/settings/deleted", "/privacy", "/signin"];
const STATIC_ASSET = /\/_next\/static\/[^"'\s)\\]+/g;

self.addEventListener("install", (event) => {
  event.waitUntil(precacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![PAGES, ASSETS].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;

  if (request.mode === "navigate") return event.respondWith(page(url));
  // Next's in-app navigation data: when offline it fails and Next reloads the page, which is served above.
  if (request.headers.get("RSC")) return;
  if (isStatic(url.pathname)) return event.respondWith(cacheFirst(request));
  event.respondWith(fetch(request).catch(() => caches.match(request)));
});

/** Caches every shell page and the scripts and styles it references. */
async function precacheShell() {
  const pages = await caches.open(PAGES);
  const assets = await caches.open(ASSETS);
  for (const path of SHELL) {
    const response = await fetch(path, { cache: "reload" });
    if (!response.ok) continue;
    await pages.put(path, response.clone());
    const urls = [...new Set((await response.text()).match(STATIC_ASSET) ?? [])];
    await Promise.all(urls.map((asset) => assets.add(asset).catch(() => undefined)));
  }
}

/** Network first so updates arrive; the cached shell when offline. The query string (the id) is kept by the page itself. */
async function page(url) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(url.pathname + url.search);
    if (response.ok) cache.put(url.pathname, response.clone());
    return response;
  } catch {
    return (await cache.match(url.pathname)) ?? (await cache.match("/")) ?? Response.error();
  }
}

function isStatic(pathname) {
  return pathname.startsWith("/_next/static/") || pathname.startsWith("/vendor/") || pathname.startsWith("/icons/");
}

/** Build files are content-hashed and vendor files versioned by install, so a cached copy stays valid. */
async function cacheFirst(request) {
  // Looked up by URL: these files never differ per request, and matching the browser's
  // worker-script request object itself missed offline, so reading couldn't start.
  const cached = await caches.match(request.url, { ignoreVary: true });
  if (cached) return cached;
  const response = await fetch(request);
  // Stored before answering, so "ready for offline" is true the moment a file has loaded.
  if (response.ok) await (await caches.open(ASSETS)).put(request, response.clone());
  return response;
}
