// Rule 12: payment-card data is never extracted or stored. Runs on all read text
// before anything else sees it, including the searchable text kept on the document.

export const CARD_REMOVED = "[card number removed]";

// 13–19 digits, optionally grouped by spaces or dashes, that pass the Luhn check. A long
// serial can occasionally pass too; removing it is the safe side of this trade-off.
const CARD_CANDIDATE = /\b\d(?:[ -]?\d){12,18}\b/g;
// Printed masked cards: "XXXX XXXX XXXX 1234", "**** **** 1234", "xxxxxxxxxxxx1234".
const MASKED_CARD = /(?:[x*•]{4}[ -]?){2,4}\d{4}\b/gi;

export function redactCardNumbers(text: string): string {
  return text
    .replace(MASKED_CARD, CARD_REMOVED)
    .replace(CARD_CANDIDATE, (match) => (passesLuhn(match.replace(/\D/g, "")) ? CARD_REMOVED : match));
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}
