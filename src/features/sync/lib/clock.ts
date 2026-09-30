import { getWatermark } from "./state";

/**
 * Timestamp for a local change. Backup finds changes by `updatedAt` above the watermark (D-35);
 * a record pulled from a device whose clock runs ahead can lift the watermark past this
 * device's clock, and a plain `now` would then hide new edits from backup. So a change is
 * always stamped after the watermark. Call it before opening a transaction (it reads meta).
 */
export async function stamp(now: Date = new Date()): Promise<string> {
  const floor = await getWatermark();
  const iso = now.toISOString();
  return iso > floor ? iso : new Date(Date.parse(floor) + 1).toISOString();
}
