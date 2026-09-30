import { normaliseNumber } from "@/features/extract/lib/money";
import { AMOUNT_PATTERN } from "@/lib/sync/schema";

export const AMOUNT_HINT = "Enter the amount as a number, like 1299.00.";

/** A typed amount that can't be stored; the field shows AMOUNT_HINT instead of saving. */
export class InvalidAmountError extends Error {
  constructor() {
    super(AMOUNT_HINT);
  }
}

/**
 * Typed amount → stored form: "1,299" → "1299.00", blank → undefined. Anything else is refused
 * rather than guessed at (rule 4), so every saved amount can be backed up.
 */
export function normaliseAmount(raw: string | undefined): string | undefined {
  const text = raw?.trim();
  if (!text) return undefined;
  const value = normaliseNumber(text);
  if (!value || !AMOUNT_PATTERN.test(value)) throw new InvalidAmountError();
  return value;
}

/** The message to show for a typed amount, or undefined when it's fine. */
export function amountProblem(raw: string): string | undefined {
  try {
    normaliseAmount(raw);
    return undefined;
  } catch {
    return AMOUNT_HINT;
  }
}
