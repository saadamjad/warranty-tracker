// Every in-app link is built here, so a route's shape is defined once.

export const purchaseHref = (id: string) => `/p/${id}`;

export const addDocumentHref = (purchaseId: string) => `/add?to=${encodeURIComponent(purchaseId)}`;

export const searchHref = (query: string) => (query ? `/search?q=${encodeURIComponent(query)}` : "/search");
