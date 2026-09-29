// D-20: per-file and per-document limits.
export const MAX_FILE_BYTES = 20 * 1024 * 1024;
export const MAX_PAGES = 20;

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const PDF_TYPE = "application/pdf";
export const ACCEPTED_TYPES = [...IMAGE_TYPES, PDF_TYPE];
