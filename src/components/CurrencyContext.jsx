import React, { createContext, useContext, useState } from "react";
import { CURRENCIES } from "../lib/currency";

const CurrencyContext = createContext(null);

export function CurrencyProvider({ defaultCurrency, children }) {
  const [currency, setCurrency] = useState(defaultCurrency || "INR");
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used inside a CurrencyProvider");
  return ctx;
}

export { CURRENCIES };
