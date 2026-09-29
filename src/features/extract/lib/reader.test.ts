import { afterEach, describe, expect, it, vi } from "vitest";
import { READ_TIMEOUT_MS, ReadTimeoutError, readText } from "./reader";

const terminate = vi.fn(async () => undefined);
const recognize = vi.fn(async (page: Blob) => ({ data: { text: await page.text() } }));
const createWorker = vi.fn();
vi.mock("tesseract.js", () => ({ createWorker: (...args: unknown[]) => createWorker(...args), OEM: { LSTM_ONLY: 1 } }));

describe("readText", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("reads pages in order and shuts the worker down", async () => {
    createWorker.mockResolvedValueOnce({ recognize, terminate });
    expect(await readText([new Blob(["one"]), new Blob(["two"])])).toBe("one\ntwo");
    await vi.waitFor(() => expect(terminate).toHaveBeenCalled());
  });

  it("gives up when the reader never finishes loading (FR-46)", async () => {
    vi.useFakeTimers();
    let finishLoading: (worker: unknown) => void = () => {};
    createWorker.mockReturnValueOnce(new Promise((resolve) => (finishLoading = resolve)));
    const reading = readText([new Blob(["x"])]);
    const outcome = expect(reading).rejects.toBeInstanceOf(ReadTimeoutError);
    await vi.advanceTimersByTimeAsync(READ_TIMEOUT_MS);
    await outcome;

    finishLoading({ recognize, terminate });
    await vi.waitFor(() => expect(terminate).toHaveBeenCalled());
  });
});
