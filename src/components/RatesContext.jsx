import React, { createContext, useContext, useMemo } from "react";
import { useCurrency } from "./CurrencyContext";
import { useProperties } from "./PropertiesContext";
import { useDateRange } from "./DateRangeContext";
import { useCompetitors } from "../lib/useCompetitors";
import { useMultiChannelRates } from "../lib/liveRates";
import { seedHeatmapGrid } from "../lib/seedData";

const RatesContext = createContext(null);

export function RatesProvider({ propertyId, children }) {
  const { currency } = useCurrency();
  const { allProperties } = useProperties();
  const { competitors, loading: competitorsLoading } = useCompetitors(propertyId);
  const { checkIn, checkOut } = useDateRange();

  const property = allProperties.find((p) => p.id === propertyId);

  // Generate the hotel names grid to get all hotel names to fetch
  const grid = useMemo(() => {
    return seedHeatmapGrid(propertyId, property?.name, competitors);
  }, [propertyId, property, competitors]);

  const hotelNames = useMemo(() => grid.map((h) => h.name), [grid]);

  const ratesState = useMultiChannelRates({
    hotelNames,
    city: property?.location,
    checkIn,
    checkOut,
    currency,
  });

  const value = useMemo(() => ({
    ...ratesState,
    competitorsLoading,
  }), [ratesState, competitorsLoading]);

  return (
    <RatesContext.Provider value={value}>
      {children}
    </RatesContext.Provider>
  );
}

export function useSharedRates() {
  const ctx = useContext(RatesContext);
  if (!ctx) throw new Error("useSharedRates must be used inside a RatesProvider");
  return ctx;
}
