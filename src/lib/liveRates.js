// Live rate-fetching layer. Calls Supabase Edge Functions that proxy to
// SerpApi, requesting the ACTUAL currently-selected currency directly from
// Google (not a static local FX table) so live numbers match Google exactly.
// Also tracks which dates/currency the current data was fetched with, so
// pages can warn when the displayed data is stale relative to the current
// selectors (dates/currency changed since the last "Refresh rates" click).

import { supabase } from "./supabaseClient";
import { useRef, useState, useCallback } from "react";

export async function fetchLiveRates({ propertyId, hotelName, city, checkIn, checkOut, currency }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-live-rates", {
      body: { propertyId, hotelName, city, checkIn, checkOut, currency },
    });
    if (error || !data || data.unavailable) {
      return { live: false, rates: null, fetchedCurrency: null };
    }
    return { live: true, rates: data.rates, fetchedCurrency: data.currency };
  } catch (e) {
    return { live: false, rates: null, fetchedCurrency: null };
  }
}

export async function fetchLiveParity({ hotelName, city, checkIn, checkOut, currency }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-parity-rates", {
      body: { hotelName, city, checkIn, checkOut, currency },
    });
    if (error || !data || data.unavailable) {
      return { live: false, referenceRate: null, channels: null, fetchedCurrency: null };
    }
    return { live: true, referenceRate: data.referenceRate, channels: data.channels, fetchedCurrency: data.currency };
  } catch (e) {
    return { live: false, referenceRate: null, channels: null, fetchedCurrency: null };
  }
}

// Full-accuracy multi-hotel fetch: real rates + real OTA links for your
// property AND every tracked competitor in one refresh. Manual-refresh only
// (no auto-polling) since this is the most expensive call (~2 SerpApi calls
// per hotel).
export async function fetchMultiChannelRates({ hotelNames, city, checkIn, checkOut, currency }) {
  try {
    const { data, error } = await supabase.functions.invoke("fetch-multi-channel-rates", {
      body: { hotels: hotelNames, city, checkIn, checkOut, currency },
    });
    if (error || !data || data.unavailable) {
      return { live: false, hotelsData: {}, fetchedCurrency: null };
    }
    const hotelsData = {};
    for (const h of data.hotels) {
      hotelsData[h.name] = h;
    }
    return { live: true, hotelsData, fetchedCurrency: data.currency };
  } catch (e) {
    return { live: false, hotelsData: {}, fetchedCurrency: null };
  }
}

export function useMultiChannelRates({ hotelNames, city, checkIn, checkOut, currency }) {
  const [state, setState] = useState({
    live: false, hotelsData: {}, fetchedCurrency: null, fetchedCheckIn: null, fetchedCheckOut: null, loading: false,
  });

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchMultiChannelRates({ hotelNames, city, checkIn, checkOut, currency });
    setState({
      live: result.live, hotelsData: result.hotelsData, fetchedCurrency: result.fetchedCurrency,
      fetchedCheckIn: checkIn, fetchedCheckOut: checkOut, loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(hotelNames), city, checkIn, checkOut, currency]);

  // Data is only trustworthy to display as fetched if neither the currency
  // nor the dates have changed since the last successful refresh — otherwise
  // it's stale relative to what's currently selected on screen.
  const isStale = state.fetchedCurrency !== currency || state.fetchedCheckIn !== checkIn || state.fetchedCheckOut !== checkOut;

  return { ...state, refresh, isStale };
}

export function useLiveParity({ hotelName, city, checkIn, checkOut, currency, fallback }) {
  const [state, setState] = useState({
    live: false, channels: fallback, fetchedCurrency: null, fetchedCheckIn: null, fetchedCheckOut: null, loading: false,
  });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchLiveParity({ hotelName, city, checkIn, checkOut, currency });
    if (!mounted.current) return;
    setState({
      live: result.live,
      channels: result.live ? result.channels : fallback,
      referenceRate: result.referenceRate,
      fetchedCurrency: result.fetchedCurrency,
      fetchedCheckIn: checkIn,
      fetchedCheckOut: checkOut,
      loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hotelName, city, checkIn, checkOut, currency]);

  const isStale = state.fetchedCurrency !== currency || state.fetchedCheckIn !== checkIn || state.fetchedCheckOut !== checkOut;

  return { ...state, refresh, isStale };
}

export function useLiveRates({ propertyId, hotelName, city, checkIn, checkOut, currency, fallback }) {
  const [state, setState] = useState({
    live: false, rates: fallback, fetchedCurrency: null, fetchedCheckIn: null, fetchedCheckOut: null, lastUpdated: null, loading: false,
  });
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    const result = await fetchLiveRates({ propertyId, hotelName, city, checkIn, checkOut, currency });
    if (!mounted.current) return;
    setState({
      live: result.live,
      rates: result.live ? result.rates : fallback,
      fetchedCurrency: result.fetchedCurrency,
      fetchedCheckIn: checkIn,
      fetchedCheckOut: checkOut,
      lastUpdated: new Date(),
      loading: false,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [propertyId, hotelName, city, checkIn, checkOut, currency]);

  const isStale = state.fetchedCurrency !== currency || state.fetchedCheckIn !== checkIn || state.fetchedCheckOut !== checkOut;

  return { ...state, refresh, isStale };
}

export function getOtaSearchLink(hotelName, ota, checkIn, checkOut) {
  const query = `${hotelName} ${ota}`;
  // Use DuckDuckGo first-result redirect (prefixing query with \)
  // to automatically bypass search result pages and land directly on the OTA hotel page.
  return `https://duckduckgo.com/?q=%5C${encodeURIComponent(query)}`;
}

