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
    const { hotelName, city, checkIn, checkOut } = await req.json();
    const query = `${hotelName} ${city}`;

    const inDate = checkIn || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })());
    const outDate = checkOut || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })());
    const dateParams = `&check_in_date=${inDate}&check_out_date=${outDate}&adults=2&currency=INR`;

    const searchUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&api_key=${serpApiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return json({ unavailable: true, reason: "Search request failed" });
    const searchData = await searchRes.json();

    const topProperty = (searchData.properties || [])[0];
    if (!topProperty?.property_token) return json({ unavailable: true, reason: "Property not found" });

    const referenceRate = topProperty.rate_per_night?.extracted_lowest;
    if (!referenceRate) return json({ unavailable: true, reason: "No reference rate available" });

    const detailUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&property_token=${topProperty.property_token}&api_key=${serpApiKey}`;
    const detailRes = await fetch(detailUrl);
    if (!detailRes.ok) return json({ unavailable: true, reason: "Detail request failed" });
    const detailData = await detailRes.json();

    const prices = detailData.prices || [];
    const channels = [];
    for (const p of prices) {
      const channel = matchChannel(p.source);
      const rate = p.rate_per_night?.extracted_lowest;
      if (!channel || !rate) continue;
      const diffPct = Math.round(((rate - referenceRate) / referenceRate) * 1000) / 10;
      const severity = diffPct <= -5 ? "high" : diffPct <= -1 ? "medium" : "ok";
      channels.push({ channel, rate, diffPct, severity, sourceLabel: p.source });
    }

    return json({ unavailable: false, referenceRate, hotelName: topProperty.name, channels });
  } catch (e) {
    return json({ unavailable: true, reason: String(e) });
  }
});
