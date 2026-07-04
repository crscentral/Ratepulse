// Proxies to a rate-intelligence provider (SerpApi's Google Hotels API by
// default). Returns { unavailable: true } until SERPAPI_KEY is set as a
// Supabase secret — the front-end falls back to sample data in that case.
//
// Activate with:
//   supabase secrets set SERPAPI_KEY=your_key_here
//   supabase functions deploy fetch-live-rates
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const SERPAPI_KEY = Deno.env.get("SERPAPI_KEY");

serve(async (req) => {
  if (!SERPAPI_KEY) {
    return new Response(JSON.stringify({ unavailable: true, reason: "No SERPAPI_KEY configured" }), { status: 200 });
  }

  try {
    const { hotelName, city } = await req.json();
    const query = `${hotelName} ${city}`;

    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}&api_key=${SERPAPI_KEY}`;
    const res = await fetch(url);
    if (!res.ok) {
      return new Response(JSON.stringify({ unavailable: true, reason: "Provider request failed" }), { status: 200 });
    }
    const data = await res.json();

    // Normalize into { ota: rate } shape — adjust mapping once you see
    // real SerpApi response shapes for your properties.
    const rates = (data.properties || []).slice(0, 1).map((p) => ({
      name: p.name,
      rate: p.rate_per_night?.extracted_lowest ?? null,
      source: "google_hotels",
    }));

    return new Response(JSON.stringify({ unavailable: false, rates }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ unavailable: true, reason: String(e) }), { status: 200 });
  }
});
