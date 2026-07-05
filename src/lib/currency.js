// Fixed display-conversion rates (static, not live FX).
// Swap FX_FROM_INR for a live FX rates API later if needed — nothing
// else needs to change, this file is the single source of truth.
export const CURRENCIES = [
  "INR", "THB", "USD", "EUR", "GBP", "SGD", "JPY", "CNY",
  "VND", "MYR", "LAK", "QAR", "AED",
];

export const CURRENCY_SYMBOLS = {
  INR: "₹", THB: "฿", USD: "$", EUR: "€", GBP: "£", SGD: "S$",
  JPY: "¥", CNY: "¥", VND: "₫", MYR: "RM", LAK: "₭", QAR: "﷼", AED: "د.إ",
};

// Rate to convert FROM 1 INR TO the given currency (approximate, static).
const FX_FROM_INR = {
  INR: 1, THB: 0.44, USD: 0.012, EUR: 0.011, GBP: 0.0095, SGD: 0.016,
  JPY: 1.8, CNY: 0.086, VND: 305, MYR: 0.055, LAK: 260, QAR: 0.044, AED: 0.044,
};

export function convert(amountInINR, toCurrency) {
  const rate = FX_FROM_INR[toCurrency] ?? 1;
  return Math.round(amountInINR * rate);
}

export function formatCurrency(amountInINR, toCurrency) {
  const symbol = CURRENCY_SYMBOLS[toCurrency] ?? "";
  return `${symbol}${convert(amountInINR, toCurrency).toLocaleString()}`;
}
