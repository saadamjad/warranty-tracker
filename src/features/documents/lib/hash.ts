/** SHA-256 over all pages in order; used to spot the same receipt saved twice (D-12). */
export async function hashPages(pages: Blob[]): Promise<string> {
  const buffers = await Promise.all(pages.map((page) => page.arrayBuffer()));
  const total = buffers.reduce((sum, buffer) => sum + buffer.byteLength, 0);
  const joined = new Uint8Array(total);
  let offset = 0;
  for (const buffer of buffers) {
    joined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  const digest = await crypto.subtle.digest("SHA-256", joined);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
