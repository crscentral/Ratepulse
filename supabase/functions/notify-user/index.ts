// Triggered by a Database Webhook on UPDATE to public.profiles.
// Sends a "you're approved" email to the user, only when `approved`
// actually flips from false -> true (not on every profile update).
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "RatePulse <approvals@crscentral.com>";
const APP_URL = "https://ratepulse.crscentral.com"; // update if your final domain differs

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record;
    const oldRecord = payload.old_record;

    // Only fire on the false -> true transition, not every update.
    const justApproved = oldRecord?.approved === false && record?.approved === true;
    if (!justApproved) {
      return new Response(JSON.stringify({ skipped: true }), { status: 200 });
    }

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1B3A6B;">You're approved</h2>
        <p>Your access to RatePulse has been approved. You can sign in now:</p>
        <p style="margin-top:24px;">
          <a href="${APP_URL}" style="background:#1B3A6B;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Sign in to RatePulse</a>
        </p>
        <p style="color:#888; font-size:12px; margin-top:24px;">
          Enter your email there and we'll send you a secure sign-in link — no password needed.
        </p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: record.email,
        subject: "You're approved for RatePulse",
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return new Response(JSON.stringify({ error: err }), { status: 500 });
    }

    return new Response(JSON.stringify({ sent: true }), { status: 200 });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500 });
  }
});
