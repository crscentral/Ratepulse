import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { PROPERTIES as SEED_PROPERTIES } from "../lib/seedData";
import { supabase } from "../lib/supabaseClient";

const PropertiesContext = createContext(null);

export function PropertiesProvider({ children }) {
  const [customProperties, setCustomProperties] = useState([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error } = await supabase
      .from("custom_properties")
      .select("*")
      .order("created_at", { ascending: false });
    setCustomProperties(error ? [] : data);
    setLoaded(true);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const allProperties = [
    ...SEED_PROPERTIES.map((p) => ({ ...p, isSeed: true })),
    ...customProperties.map((p) => ({
      id: p.id,
      name: p.name,
      location: p.location,
      rooms: p.rooms,
      currency: p.currency || "INR",
      isSeed: false,
    })),
  ];

  return (
    <PropertiesContext.Provider value={{ allProperties, loaded, refresh }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const ctx = useContext(PropertiesContext);
  if (!ctx) throw new Error("useProperties must be used inside a PropertiesProvider");
  return ctx;
}

export function isSeedProperty(propertyId) {
  return SEED_PROPERTIES.some((p) => p.id === propertyId);
}
