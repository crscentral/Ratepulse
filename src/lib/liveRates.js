// Live rate-fetching layer. Currently calls a Supabase Edge Function
// (`fetch-live-rates`) that proxies to a rate-data provider (e.g. SerpApi's
// Google Hotels API). Until a provider API key is configured as a Supabase
// secret, the Edge Function returns { unavailable: true } and callers
// should fall back to seed data.
//
// See supabase/functions/fetch-live-rates/index.ts for the provider call,
// and the README for how to activate it once you have an API key.

import { supabase } from "./supabaseClient";

export async function fetchLiveRates({ propertyId, hotelName, city }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-live-rates", {
      body: { propertyId, hotelName, city },
    });
    if (error || !data || data.unavailable) {
      return { live: false, rates: null };
    }
    return { live: true, rates: data.rates };
  } catch (e) {
    return { live: false, rates: null };
  }
}

// React hook: polls fetchLiveRates every `intervalMs` (default 60s).
// Falls back silently to whatever `fallback` value is passed in.
import { useEffect, useRef, useState } from "react";

export function useLiveRates({ propertyId, hotelName, city, fallback, intervalMs = 60000 }) {
  const [state, setState] = useState({ live: false, rates: fallback, lastUpdated: null });
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    async function poll() {
      const result = await fetchLiveRates({ propertyId, hotelName, city });
      if (!mounted.current) return;
      setState({
        live: result.live,
        rates: result.live ? result.rates : fallback,
        lastUpdated: new Date(),
      });
    }
    poll();
    const interval = setInterval(poll, intervalMs);
    return () => {
      mounted.current = false;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId]);

  return state;
}
