// Fetches real per-channel rates AND direct OTA links for a set of hotels
// (your property + its competitors) in one call, using serpapi_key_2 (the
// dedicated rate-refresh key). This powers "full accuracy" click-through
// links on Rate Comparison and Heatmap: every cell we get real data for
// becomes a working link straight to that OTA's page for that hotel.
//
// COST NOTE: this does 2 SerpApi calls per hotel (search + detail), run in
// parallel. With N hotels (property + competitors), one refresh = ~2N calls.
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

async function fetchHotelChannels(hotelName, city, serpApiKey, checkIn, checkOut, currency) {
  // Clean up city to extract only the city name from a full address
  const cleanCityName = (() => {
    if (!city) return "";
    const parts = city.split(",").map((p) => p.trim());
    if (parts.length >= 3) return parts[1];
    return parts[0];
  })();

  const query = `${hotelName} ${cleanCityName}`;
  const inDate = checkIn || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })());
  const outDate = checkOut || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })());
  const curr = currency || "USD";
  const dateParams = `&check_in_date=${inDate}&check_out_date=${outDate}&adults=2&currency=${curr}`;

  try {
    const searchUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&api_key=${serpApiKey}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) return { name: hotelName, unavailable: true, channels: {} };
    const searchData = await searchRes.json();

    let referenceRate = null;
    let propertyPageLink = null;
    let pricesList = [];

    if (searchData.properties && searchData.properties.length > 0) {
      const top = searchData.properties[0];
      if (!top?.property_token) return { name: hotelName, unavailable: true, channels: {} };

      referenceRate = top.rate_per_night?.extracted_lowest ?? null;
      propertyPageLink = searchData.search_metadata?.google_hotels_url || null;

      const detailUrl = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}${dateParams}&property_token=${top.property_token}&api_key=${serpApiKey}`;
      const detailRes = await fetch(detailUrl);
      if (!detailRes.ok) {
        // Fallback: return website only
        const channels = {
          "WEBSITE": { rate: referenceRate, link: propertyPageLink }
        };
        return { name: hotelName, unavailable: false, referenceRate, channels };
      }
      const detailData = await detailRes.json();
      pricesList = [
        ...(detailData.featured_prices || []),
        ...(detailData.prices || [])
      ];
    } else if (searchData.name) {
      // Direct detail page
      referenceRate = searchData.rate_per_night?.extracted_lowest ?? null;
      propertyPageLink = searchData.search_metadata?.google_hotels_url || null;
      pricesList = [
        ...(searchData.featured_prices || []),
        ...(searchData.prices || [])
      ];
    } else {
      return { name: hotelName, unavailable: true, channels: {} };
    }

    const channels = {};
    for (const p of pricesList) {
      const channel = matchChannel(p.source);
      const rate = p.rate_per_night?.extracted_lowest;
      if (!channel || !rate) continue;
      if (!channels[channel] || rate < channels[channel].rate) {
        channels[channel] = { rate, link: p.link || null };
      }
    }
    // WEBSITE column
    channels["WEBSITE"] = { rate: referenceRate, link: propertyPageLink };

    return { name: hotelName, unavailable: false, referenceRate, channels };
  } catch (e) {
    return { name: hotelName, unavailable: true, channels: {}, reason: String(e) };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { data: serpApiKey } = await supabase.rpc("get_vault_secret", { secret_name: "serpapi_key_2" });
  if (!serpApiKey) return json({ unavailable: true, reason: "No serpapi_key_2 found in Vault", hotels: [] });

  try {
    const { hotels, city, checkIn, checkOut, currency } = await req.json(); // hotels: string[] of hotel names, first = your property
    if (!Array.isArray(hotels) || hotels.length === 0) return json({ unavailable: true, reason: "No hotels provided", hotels: [] });

    const results = await Promise.all(hotels.map((h) => fetchHotelChannels(h, city, serpApiKey, checkIn, checkOut, currency)));
    return json({ unavailable: false, hotels: results, currency: currency || "USD" });
  } catch (e) {
    return json({ unavailable: true, reason: String(e), hotels: [] });
  }
});
