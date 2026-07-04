// Fixed display-conversion rates (static, not live FX).
// Swap FX_RATES for a live rates API call later if needed — nothing
// else needs to change, this file is the single source of truth.
export const CURRENCIES = ["INR", "THB", "USD"];

export const CURRENCY_SYMBOLS = { INR: "₹", THB: "฿", USD: "$" };

// Rate to convert FROM 1 INR TO the given currency (approximate, static).
const FX_FROM_INR = { INR: 1, THB: 0.44, USD: 0.012 };

export function convert(amountInINR, toCurrency) {
  const rate = FX_FROM_INR[toCurrency] ?? 1;
  return Math.round(amountInINR * rate);
}

export function formatCurrency(amountInINR, toCurrency) {
  const symbol = CURRENCY_SYMBOLS[toCurrency] ?? "";
  return `${symbol}${convert(amountInINR, toCurrency).toLocaleString()}`;
}
