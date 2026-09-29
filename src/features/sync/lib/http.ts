// JSON calls to the backup API. A non-2xx answer becomes SyncHttpError with its status;
// a network failure (offline) surfaces as the browser's TypeError.

export class SyncHttpError extends Error {
  constructor(readonly status: number) {
    super(`Backup request failed with ${status}`);
  }
}

export async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!response.ok) throw new SyncHttpError(response.status);
  return response.json() as Promise<T>;
}

export async function getJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new SyncHttpError(response.status);
  return response.json() as Promise<T>;
}
