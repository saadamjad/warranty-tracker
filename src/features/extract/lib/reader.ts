// On-device reading with Tesseract.js (D-16). Everything is served by the app itself
// (D-32), so reading works offline and no image leaves the device (SPEC §7).

import type { Worker } from "tesseract.js";

/** Past this, reading is stopped and the user fills in details themselves (FR-46). */
export const READ_TIMEOUT_MS = 90_000;

export class ReadTimeoutError extends Error {
  constructor() {
    super("Reading took too long");
  }
}

/** Reads pages in order; `onProgress` gets 0..1 across all pages. */
export async function readText(pages: Blob[], onProgress: (progress: number) => void = () => {}): Promise<string> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  // Covers loading the reader too: a stalled download must not leave the user waiting.
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ReadTimeoutError()), READ_TIMEOUT_MS);
  });

  let page = 0;
  const starting = startWorker((progress) => onProgress((page + progress) / pages.length));
  let worker: Worker | undefined;

  try {
    worker = await Promise.race([starting, timeout]);
    const texts: string[] = [];
    for (; page < pages.length; page++) {
      const result = await Promise.race([worker.recognize(pages[page]), timeout]);
      texts.push(result.data.text);
    }
    onProgress(1);
    return texts.join("\n");
  } finally {
    clearTimeout(timer);
    // A worker that finished loading after we gave up is shut down too.
    (worker ? Promise.resolve(worker) : starting).then((w) => w.terminate()).catch(() => undefined);
  }
}

/** Loads the reader once and closes it, so its files are cached for reading offline. */
export async function prepareReader(): Promise<void> {
  const worker = await startWorker(() => {});
  await worker.terminate();
}

async function startWorker(onPageProgress: (progress: number) => void): Promise<Worker> {
  const { createWorker, OEM } = await import("tesseract.js");
  return createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/core",
    langPath: "/vendor/tesseract/lang",
    gzip: true,
    workerBlobURL: false,
    logger: (message) => {
      if (message.status === "recognizing text") onPageProgress(message.progress);
    },
  });
}
