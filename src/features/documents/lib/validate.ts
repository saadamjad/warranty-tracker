import { ACCEPTED_TYPES, MAX_FILE_BYTES, MAX_PAGES } from "./limits";

export type FileCheck = { ok: true } | { ok: false; message: string };

const HEIC = /\.(heic|heif)$/i;

/** Plain-language reason plus a way forward for any file we can't take (EC-14..16, §5 errors). */
export function checkFile(file: Pick<File, "name" | "type" | "size">): FileCheck {
  if (HEIC.test(file.name) || file.type.startsWith("image/hei")) {
    return {
      ok: false,
      message: `"${file.name}" is an iPhone photo format this browser can't open. Take a screenshot of it, or use "Take photo" instead.`,
    };
  }
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return {
      ok: false,
      message: `"${file.name}" isn't a photo or PDF. Save it as a photo, screenshot or PDF and try again, or enter the details yourself.`,
    };
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      message: `"${file.name}" is larger than 20 MB. Try a screenshot or a smaller photo of it.`,
    };
  }
  return { ok: true };
}

export function checkPageCount(count: number): FileCheck {
  return count > MAX_PAGES
    ? { ok: false, message: `A document can have up to ${MAX_PAGES} pages. Save the rest as a second document on the same purchase.` }
    : { ok: true };
}
