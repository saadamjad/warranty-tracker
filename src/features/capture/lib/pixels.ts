// Pure pixel maths for the readability pass (FR-06, FR-07). Works on RGBA arrays so it
// can be unit tested without a canvas.

export type Box = { x: number; y: number; width: number; height: number };

export function luminance(rgba: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(rgba.length / 4);
  for (let i = 0; i < out.length; i++) {
    out[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  }
  return out;
}

/** Below this spread the image is flat (blank or one tone); stretching would only add noise. */
const MIN_RANGE = 16;

/**
 * Grayscale with a contrast stretch between the 2nd and 98th percentiles, which lifts
 * faded thermal print without promising to restore it (EC-12). Writes into `rgba`.
 */
export function stretchContrast(rgba: Uint8ClampedArray): void {
  const gray = luminance(rgba);
  const histogram = new Uint32Array(256);
  for (const value of gray) histogram[value]++;

  // Measured on the darkest and lightest values actually present, so sparse text on a mostly
  // white page (under 2% of pixels) still counts instead of the page turning black.
  const low = Math.min(percentile(histogram, gray.length, 0.02), percentile(histogram, gray.length, 0.001));
  const high = percentile(histogram, gray.length, 0.98);
  const range = high - low;
  if (range < MIN_RANGE) {
    for (let i = 0; i < gray.length; i++) rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = gray[i];
    return;
  }

  for (let i = 0; i < gray.length; i++) {
    const value = ((gray[i] - low) * 255) / range;
    rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = value;
  }
}

function percentile(histogram: Uint32Array, total: number, fraction: number): number {
  const target = total * fraction;
  let seen = 0;
  for (let value = 0; value < 256; value++) {
    seen += histogram[value];
    if (seen >= target) return value;
  }
  return 255;
}

const CONTENT_DIFFERENCE = 40;
const MIN_AREA = 0.2;
const MAX_AREA = 0.95;

/** Borders brighter than this are paper, a scan or a screenshot, not a table around the paper. */
const LIGHT_BORDER = 128;

/**
 * Best-effort bounds of light paper on a darker background, judged from the border colour.
 * Returns null when unsure — including light borders, where sparse dark text would be
 * mistaken for the edge — so the caller keeps the full image rather than cutting text off.
 */
export function findContentBox(gray: Uint8ClampedArray, width: number, height: number): Box | null {
  const background = borderMean(gray, width, height);
  if (background > LIGHT_BORDER) return null;
  const rowHits = new Uint32Array(height);
  const colHits = new Uint32Array(width);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (Math.abs(gray[y * width + x] - background) > CONTENT_DIFFERENCE) {
        rowHits[y]++;
        colHits[x]++;
      }
    }
  }

  const rows = spanAbove(rowHits, width * 0.05);
  const cols = spanAbove(colHits, height * 0.05);
  if (!rows || !cols) return null;

  const box = { x: cols[0], y: rows[0], width: cols[1] - cols[0] + 1, height: rows[1] - rows[0] + 1 };
  const area = (box.width * box.height) / (width * height);
  if (area < MIN_AREA || area > MAX_AREA) return null;
  return pad(box, width, height);
}

function borderMean(gray: Uint8ClampedArray, width: number, height: number): number {
  let sum = 0;
  let count = 0;
  for (let x = 0; x < width; x++) {
    sum += gray[x] + gray[(height - 1) * width + x];
    count += 2;
  }
  for (let y = 0; y < height; y++) {
    sum += gray[y * width] + gray[y * width + width - 1];
    count += 2;
  }
  return sum / count;
}

function spanAbove(hits: Uint32Array, threshold: number): [number, number] | null {
  let first = -1;
  let last = -1;
  hits.forEach((count, index) => {
    if (count > threshold) {
      if (first < 0) first = index;
      last = index;
    }
  });
  return first < 0 ? null : [first, last];
}

function pad(box: Box, width: number, height: number): Box {
  const margin = Math.round(Math.min(width, height) * 0.02);
  const x = Math.max(0, box.x - margin);
  const y = Math.max(0, box.y - margin);
  return {
    x,
    y,
    width: Math.min(width, box.x + box.width + margin) - x,
    height: Math.min(height, box.y + box.height + margin) - y,
  };
}
