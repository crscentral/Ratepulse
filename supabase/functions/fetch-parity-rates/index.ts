// Live Rate Parity check: fetches a hotel's per-channel prices from
// SerpApi's Google Hotels engine and flags channels undercutting the
// reference (overall lowest) rate. Uses serpapi_key_2 (same key as
// fetch-live-rates, dedicated to the rate-refresh usage bucket).
//
// checkIn/checkOut now come from the request body (the shared date range
// picker on Rate Comparison), falling back to tomorrow/day-after only if
// none was provided.
//
// NOTE on "direct" rate: Google Hotels doesn't reliably label which price
// is the hotel's own official website vs. a reseller. We use the overall
// lowest listed rate as the parity reference point.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body) {
  return new Response(JSON.stringify(body), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

const CHANNEL_MATCHERS = [
  ["booking.com", "BOOKING.COM"],
  ["expedia", "EXPEDIA"],
  ["agoda", "AGODA"],
  ["makemytrip", "MAKEMYTRIP"],
  ["airbnb", "AIRBNB"],
  ["traveloka", "TRAVELOKA"],
  ["hrs", "HRS"],
  ["trivago", "TRIVAGO"],
  ["tripadvisor", "TRIPADVISOR"],
  ["lastminute", "LASTMINUTE"],
  ["skyscanner", "SKYSCANNER"],
  ["cleartrip", "CLEARTRIP"],
  ["priceline", "PRICELINE"],
  ["vio.com", "VIO.COM"],
  ["klook", "KLOOK"],
  ["hutchgo", "HUTCHGO"],
  ["trip.com", "TRIP.COM"],
];

function matchChannel(source) {
  const lower = (source || "").toLowerCase();
  for (const [needle, label] of CHANNEL_MATCHERS) {
    if (lower.includes(needle)) return label;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { data: serpApiKey } = await supabase.rpc("get_vault_secret", { secret_name: "serpapi_key_2" });
  if (!serpApiKey) return json({ unavailable: true, reason: "No serpapi_key_2 found in Vault" });

  try {
    const { hotelName, city, checkIn, checkOut, currency } = await req.json();

    // Clean up city to extract only the city name from a full address
    const cleanCityName = (() => {
      if (!city) return "";
      const parts = city.split(",").map((p) => p.trim());
      if (parts.length >= 3) return parts[1];
      return parts[0];
    })();

    const query = (() => {
      if (!cleanCityName) return hotelName;
      if (hotelName.toLowerCase().includes(cleanCityName.toLowerCase())) return hotelName;
      return `${hotelName} ${cleanCityName}`;
    })();

    const inDate = checkIn || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })());
    const outDate = checkOut || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })());
    const curr = currency || "USD";
    const dateParams = `&check_in_date=${inDate}&check_out_date=${outDate}&adults=2&currency=${curr}`;

    const searchUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&api_key=${serpApiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return json({ unavailable: true, reason: "Search request failed" });
    const searchData = await searchRes.json();

    let referenceRate = null;
    let pricesList = [];
    let hotelNameResult = hotelName;

    if (searchData.properties && searchData.properties.length > 0) {
      const topProperty = searchData.properties[0];
      if (!topProperty?.property_token) return json({ unavailable: true, reason: "Property not found" });

      referenceRate = topProperty.rate_per_night?.extracted_lowest;
      hotelNameResult = topProperty.name;

      const detailUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&property_token=${topProperty.property_token}&api_key=${serpApiKey}`;
      const detailRes = await fetch(detailUrl);
      if (!detailRes.ok) return json({ unavailable: true, reason: "Detail request failed" });
      const detailData = await detailRes.json();
      pricesList = [
        ...(detailData.featured_prices || []),
        ...(detailData.prices || [])
      ];
    } else if (searchData.name) {
      referenceRate = searchData.rate_per_night?.extracted_lowest;
      hotelNameResult = searchData.name;
      pricesList = [
        ...(searchData.featured_prices || []),
        ...(searchData.prices || [])
      ];
    } else {
      return json({ unavailable: true, reason: "Property not found" });
    }

    if (!referenceRate) return json({ unavailable: true, reason: "No reference rate available" });

    const channels = [];
    const channelMap = {};
    for (const p of pricesList) {
      const channel = matchChannel(p.source);
      const rate = p.rate_per_night?.extracted_lowest;
      if (!channel || !rate) continue;
      if (!channelMap[channel] || rate < channelMap[channel].rate) {
        channelMap[channel] = { rate, sourceLabel: p.source };
      }
    }

    for (const [channel, info] of Object.entries(channelMap)) {
      const diffPct = Math.round(((info.rate - referenceRate) / referenceRate) * 1000) / 10;
      const severity = diffPct <= -5 ? "high" : diffPct <= -1 ? "medium" : "ok";
      channels.push({ channel, rate: info.rate, diffPct, severity, sourceLabel: info.sourceLabel });
    }

    return json({ unavailable: false, referenceRate, hotelName: hotelNameResult, channels, currency: curr });
  } catch (e) {
    return json({ unavailable: true, reason: String(e) });
  }
});
