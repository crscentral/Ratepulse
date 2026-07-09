import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// Loads the real, DB-backed competitor list for any property (seeded or
// custom-added) — replaces the old static COMPETITORS_BY_PROPERTY lookup so
// every page works the same way regardless of which property is selected.
export function useCompetitors(propertyId) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    supabase
      .from("competitors")
      .select("name")
      .eq("property_id", propertyId)
      .order("created_at", { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        setCompetitors(error ? [] : data.map((c) => c.name));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  return { competitors, loading };
}
