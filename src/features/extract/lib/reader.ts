// On-device reading with Tesseract.js (D-16). Everything is served by the app itself
// (D-32), so reading works offline and no image leaves the device (SPEC §7).

/** Past this, reading is stopped and the user fills in details themselves (FR-46). */
export const READ_TIMEOUT_MS = 90_000;

export class ReadTimeoutError extends Error {
  constructor() {
    super("Reading took too long");
  }
}

/** Reads pages in order; `onProgress` gets 0..1 across all pages. */
export async function readText(pages: Blob[], onProgress: (progress: number) => void = () => {}): Promise<string> {
  const { createWorker, OEM } = await import("tesseract.js");
  let page = 0;
  const worker = await createWorker("eng", OEM.LSTM_ONLY, {
    workerPath: "/vendor/tesseract/worker.min.js",
    corePath: "/vendor/tesseract/core",
    langPath: "/vendor/tesseract/lang",
    gzip: true,
    workerBlobURL: false,
    logger: (message) => {
      if (message.status === "recognizing text") onProgress((page + message.progress) / pages.length);
    },
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new ReadTimeoutError()), READ_TIMEOUT_MS);
  });

  try {
    const texts: string[] = [];
    for (; page < pages.length; page++) {
      const result = await Promise.race([worker.recognize(pages[page]), timeout]);
      texts.push(result.data.text);
    }
    onProgress(1);
    return texts.join("\n");
  } finally {
    clearTimeout(timer);
    await worker.terminate();
  }
}
