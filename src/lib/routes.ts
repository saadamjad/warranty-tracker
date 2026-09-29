// Every in-app link is built here, so a route's shape is defined once.
// Ids travel in the query string so each page is one static shell the service worker can
// cache and open offline for any purchase (D-33).

export const purchaseHref = (id: string) => `/p?id=${encodeURIComponent(id)}`;

export const addDocumentHref = (purchaseId: string) => `/add?to=${encodeURIComponent(purchaseId)}`;

export const searchHref = (query: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search");
