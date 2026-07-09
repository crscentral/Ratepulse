// Triggered by a Database Webhook on INSERT into public.profiles.
// Sends an email to the admin with one-click Approve / Reject links.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`;

const ADMIN_EMAIL = "info@crscentral.com";
// Must be an address on a domain you've verified in Resend (see README).
const FROM_EMAIL = "RatePulse <approvals@crscentral.com>";

serve(async (req) => {
  try {
    const payload = await req.json();
    const record = payload.record; // the newly inserted profiles row

    if (!record?.approval_token || !record?.email) {
      return new Response(JSON.stringify({ error: "Missing record data" }), { status: 400 });
    }

    const approveUrl = `${FUNCTIONS_BASE}/approve-user?token=${record.approval_token}&action=approve`;
    const rejectUrl = `${FUNCTIONS_BASE}/approve-user?token=${record.approval_token}&action=reject`;

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color:#1B3A6B;">New RatePulse access request</h2>
        <p><strong>${record.email}</strong> has requested access to RatePulse.</p>
        <p style="margin-top:24px;">
          <a href="${approveUrl}" style="background:#1B3A6B;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;margin-right:12px;">Approve</a>
          <a href="${rejectUrl}" style="background:#DC2626;color:#ffffff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;">Reject</a>
        </p>
        <p style="color:#888; font-size:12px; margin-top:24px;">This link can only be used once.</p>
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
        to: ADMIN_EMAIL,
        subject: `RatePulse access request — ${record.email}`,
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
