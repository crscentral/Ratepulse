// Given a hotel name + city, geocodes it via SerpApi's Google Maps engine,
// then searches nearby hotels around those coordinates and returns up to 5
// (excluding the property itself). Uses the same serpapi_key as the other
// search-related functions (from Vault).
//
// NOTE on scope: this filters by proximity only (~10km, approximated via
// map zoom level, since this SerpApi engine doesn't support an exact radius
// parameter). It does NOT filter by "rate within 0-25%" of the new property,
// since that would require an additional live rate lookup per candidate
// hotel (extra paid API calls just to add one property) — flagged clearly
// rather than silently skipped.
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { data: serpApiKey } = await supabase.rpc("get_vault_secret", { secret_name: "serpapi_key" });
  if (!serpApiKey) return json({ competitors: [], reason: "No serpapi_key found in Vault" });

  try {
    const { hotelName, city } = await req.json();

    // Step 1: geocode the new property itself
    const geoUrl = `https://serpapi.com/search.json?engine=google_maps&type=search&q=${encodeURIComponent(`${hotelName} ${city}`)}&api_key=${serpApiKey}`;
    const geoRes = await fetch(geoUrl);
    if (!geoRes.ok) return json({ competitors: [], reason: "Geocoding request failed" });
    const geoData = await geoRes.json();

    const coords = geoData.place_results?.gps_coordinates || geoData.local_results?.[0]?.gps_coordinates;
    if (!coords) return json({ competitors: [], reason: "Could not locate this property on the map" });

    // Step 2: search nearby hotels around those coordinates (~10km, approximate)
    const nearbyUrl = `https://serpapi.com/search.json?engine=google_maps&type=search&q=hotels&ll=@${coords.latitude},${coords.longitude},13z&api_key=${serpApiKey}`;
    const nearbyRes = await fetch(nearbyUrl);
    if (!nearbyRes.ok) return json({ competitors: [], reason: "Nearby search failed" });
    const nearbyData = await nearbyRes.json();

    const results = nearbyData.local_results || [];
    const competitors = results
      .filter((r) => r.title && r.title.toLowerCase() !== hotelName.toLowerCase())
      .slice(0, 5)
      .map((r) => ({ name: r.title, address: r.address || "" }));

    return json({ competitors });
  } catch (e) {
    return json({ competitors: [], reason: String(e) });
  }
});
