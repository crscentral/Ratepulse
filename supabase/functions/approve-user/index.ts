// Public endpoint — clicked directly from the admin's email, no login required.
// Deploy with: supabase functions deploy approve-user --no-verify-jwt
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); // auto-available in Edge Functions

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

serve(async (req) => {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const action = url.searchParams.get("action") || "approve";

  if (!token) return htmlResponse("Missing approval token.", false);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("approval_token", token)
    .single();

  if (error || !profile) {
    return htmlResponse("This approval link is invalid or has already been used.", false);
  }

  if (action === "reject") {
    await supabase.from("profiles").delete().eq("id", profile.id);
    return htmlResponse(`Access request from ${profile.email} was rejected.`, true);
  }

  // Approve, and null the token so this link can't be reused.
  await supabase
    .from("profiles")
    .update({ approved: true, approved_at: new Date().toISOString(), approval_token: null })
    .eq("id", profile.id);

  return htmlResponse(`${profile.email} has been approved and can now access RatePulse.`, true);
});

function htmlResponse(message, success) {
  return new Response(
    `<html><body style="font-family:sans-serif;text-align:center;padding:60px;">
      <h2 style="color:${success ? "#1B3A6B" : "#DC2626"};">${success ? "Done" : "Link expired"}</h2>
      <p>${message}</p>
    </body></html>`,
    { headers: { "Content-Type": "text/html" }, status: 200 }
  );
}
