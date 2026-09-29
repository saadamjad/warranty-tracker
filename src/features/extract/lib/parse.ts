import { findPurchaseDate } from "./dates";
import { findLabelled, findWarrantyMonths } from "./labels";
import { findMerchant } from "./merchant";
import { findAmount, findCurrency } from "./money";
import { redactCardNumbers } from "./redact";
import type { ExtractedFields, Extraction } from "./types";

/**
 * Turns read receipt text into suggested fields. Card numbers are removed first (rule 12);
 * anything not found is simply absent, never invented (rule 6).
 */
export function parseReceipt(rawText: string, today: Date = new Date()): Extraction {
  const text = redactCardNumbers(rawText.replace(/\r\n?/g, "\n"));
  const fields: ExtractedFields = {
    merchant: findMerchant(text),
    purchaseDate: findPurchaseDate(text, today),
    amount: findAmount(text),
    currency: findCurrency(text),
    reference: findLabelled(text, "reference"),
    serial: findLabelled(text, "serial"),
    model: findLabelled(text, "model"),
    warrantyMonths: findWarrantyMonths(text),
  };
  return { text, fields: withoutEmpty(fields) };
}

function withoutEmpty(fields: ExtractedFields): ExtractedFields {
  return Object.fromEntries(Object.entries(fields).filter(([, found]) => found !== undefined));
}
