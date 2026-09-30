import { readMeta, writeMeta } from "@/lib/db/meta";
import { prepareReader } from "./reader";

const KEY = "readerPrepared";

type Connection = { saveData?: boolean };

/**
 * Makes receipt reading available offline: the first time capture opens with a connection,
 * the reader loads in the background and the service worker keeps its files. Skipped when
 * the user asked the browser to save data. Returns whether it prepared the reader now.
 */
export async function prepareOfflineReading(): Promise<boolean> {
  const connection = (navigator as Navigator & { connection?: Connection }).connection;
  if (!navigator.onLine || connection?.saveData || (await readMeta(KEY, false))) return false;
  await prepareReader();
  await writeMeta(KEY, true);
  return true;
}
