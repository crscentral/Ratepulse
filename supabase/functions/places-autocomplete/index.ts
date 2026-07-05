// Proxies to Google Places Autocomplete so the API key never reaches the
// browser. Returns { unavailable: true } until GOOGLE_PLACES_API_KEY is set.
//
// Activate with:
//   supabase secrets set GOOGLE_PLACES_API_KEY=your_key_here
//   supabase functions deploy places-autocomplete
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const GOOGLE_PLACES_API_KEY = Deno.env.get("GOOGLE_PLACES_API_KEY");

serve(async (req) => {
  if (!GOOGLE_PLACES_API_KEY) {
    return new Response(JSON.stringify({ unavailable: true, predictions: [] }), { status: 200 });
  }

  try {
    const { input } = await req.json();
    const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      input
    )}&types=lodging&key=${GOOGLE_PLACES_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const predictions = (data.predictions || []).map((p) => ({
      description: p.description,
      placeId: p.place_id,
    }));

    return new Response(JSON.stringify({ unavailable: false, predictions }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ unavailable: true, predictions: [], reason: String(e) }), { status: 200 });
  }
});
