// Reads SERPAPI_KEY_2 from Supabase Vault via the get_vault_secret RPC.
// This is a dedicated key for rate-refresh usage (Rate Comparison + Heatmap),
// kept separate from the property/competitor search key.
//
// checkIn/checkOut now come from the request body (set via the date range
// picker on Rate Comparison and shared across pages), falling back to
// tomorrow/day-after only if none was provided.
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

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { data: serpApiKey } = await supabase.rpc("get_vault_secret", { secret_name: "serpapi_key_2" });

  if (!serpApiKey) {
    return new Response(JSON.stringify({ unavailable: true, reason: "No serpapi_key_2 found in Vault" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { hotelName, city, checkIn, checkOut } = await req.json();
    const query = `${hotelName} ${city}`;

    const inDate = checkIn || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 1); return d; })());
    const outDate = checkOut || formatDate((() => { const d = new Date(); d.setDate(d.getDate() + 2); return d; })());

    const url = `https://serpapi.com/search.json?engine=google_hotels&q=${encodeURIComponent(query)}&check_in_date=${inDate}&check_out_date=${outDate}&adults=2&currency=INR&api_key=${serpApiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      const errText = await res.text();
      return new Response(JSON.stringify({ unavailable: true, reason: errText.slice(0, 300) }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const data = await res.json();

    const rates = (data.properties || []).slice(0, 1).map((p) => ({
      name: p.name,
      rate: p.rate_per_night?.extracted_lowest ?? null,
      source: "google_hotels",
    }));

    return new Response(JSON.stringify({ unavailable: false, rates }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ unavailable: true, reason: String(e) }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
