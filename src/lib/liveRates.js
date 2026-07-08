// Live rate-fetching layer. Calls Supabase Edge Functions that proxy to
// SerpApi. All fetch functions now accept checkIn/checkOut dates (from
// DateRangeContext) so every live lookup checks the same selected dates
// across Rate Comparison, Rate Parity, and Heatmap.

import { supabase } from "./supabaseClient";
import { useRef, useState, useCallback } from "react";

export async function fetchLiveRates({ propertyId, hotelName, city, checkIn, checkOut }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-live-rates", {
      body: { propertyId, hotelName, city, checkIn, checkOut },
    });
    if (error || !data || data.unavailable) {
      return { live: false, rates: null };
    }
    return { live: true, rates: data.rates };
  } catch (e) {
    return { live: false, rates: null };
  }
}

export async function fetchLiveParity({ hotelName, city, checkIn, checkOut }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-parity-rates", {
      body: { hotelName, city, checkIn, checkOut },
    });
    if (error || !data || data.unavailable) {
      return { live: false, referenceRate: null, channels: null };
    }
    return { live: true, referenceRate: data.referenceRate, channels: data.channels };
  } catch (e) {
    return { live: false, referenceRate: null, channels: null };
  }
}

// Full-accuracy multi-hotel fetch: real rates + real OTA links for your
// property AND every tracked competitor in one refresh. Manual-refresh only
// (no auto-polling) since this is the most expensive call (~2 SerpApi calls
// per hotel).
export async function fetchMultiChannelRates({ hotelNames, city, checkIn, checkOut }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-multi-channel-rates", {
      body: { hotels: hotelNames, city, checkIn, checkOut },
    });
    if (error || !data || data.unavailable) {
      return { live: false, hotelsData: {} };
    }
    const hotelsData = {};
    for (const h of data.hotels) {
      hotelsData[h.name] = h;
    }
    return { live: true, hotelsData };
  } catch (e) {
    return { live: false, hotelsData: {} };
  }
}

export function useMultiChannelRates({ hotelNames, city, checkIn, checkOut }) {
  const [state, setState] = useState({ live: false, hotelsData: {}, loading: false });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchMultiChannelRates({ hotelNames, city, checkIn, checkOut });
    setState({ live: result.live, hotelsData: result.hotelsData, loading: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hotelNames), city, checkIn, checkOut]);

  return { ...state, refresh };
}

export function useLiveParity({ hotelName, city, checkIn, checkOut, fallback }) {
  const [state, setState] = useState({ live: false, channels: fallback, loading: false });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchLiveParity({ hotelName, city, checkIn, checkOut });
    if (!mounted.current) return;
    setState({
      live: result.live,
      channels: result.live ? result.channels : fallback,
      referenceRate: result.referenceRate,
      loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelName, city, checkIn, checkOut]);

  return { ...state, refresh };
}

export function useLiveRates({ propertyId, hotelName, city, checkIn, checkOut, fallback }) {
  const [state, setState] = useState({ live: false, rates: fallback, lastUpdated: null, loading: false });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchLiveRates({ propertyId, hotelName, city, checkIn, checkOut });
    if (!mounted.current) return;
    setState({
      live: result.live,
      rates: result.live ? result.rates : fallback,
      lastUpdated: new Date(),
      loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, hotelName, city, checkIn, checkOut]);

  return { ...state, refresh };
}
