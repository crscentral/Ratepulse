# RatePulse — CRS Central

Hotel competitive rate intelligence dashboard. React + Tailwind CSS frontend, Supabase for auth and the subscriber-approval workflow.

## What's already done
- All 8 pages built: Dashboard, Rate Comparison, Rate Parity, Heatmap, Recommendations, Alerts, Properties, Export
- Real Supabase magic-link authentication + admin approval flow (already pointed at your live Supabase project)
- Seeded demo data for two properties (Dhavara Boutique Hotel, Azure Beach Resort)
- CRS Central branding (navy/gold/cream, Playfair Display + Inter)

## Prerequisite: run the database schema
Before this app will work, run `supabase/migrations/001_initial_schema.sql` in your Supabase project's SQL Editor.

Then log into the app once with your own email, and run:
```sql
update public.profiles set is_admin = true, approved = true where email = 'crscentral.rm@gmail.com';
```

---

## Setting up email-based approval (Approve/Reject from your inbox)

When someone requests access, an email goes to **info@crscentral.com** with one-click **Approve** / **Reject** buttons — no need to log into an admin panel.

### 1. Create a Resend account and verify your domain
- Go to **resend.com** → sign up.
- Domains → Add Domain → enter `crscentral.com` → Resend gives you DNS records (SPF, DKIM) to add at your domain registrar (wherever crscentral.com's DNS is managed).
- Wait for verification (usually a few minutes to a few hours). Until verified, Resend can only send test emails to your own signup address — not to info@crscentral.com — so this step is required before it'll work for real.
- API Keys → Create API Key → copy it, you'll need it below.

### 2. Install the Supabase CLI and deploy the two Edge Functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref pnxokgsyzrkblgfcbndc
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase functions deploy notify-admin
supabase functions deploy approve-user --no-verify-jwt
```
(`--no-verify-jwt` on `approve-user` is required — it's clicked from a plain email link with no login session, so it can't require auth. Security instead comes from the random one-time token in the link.)

### 3. Connect the trigger: Database Webhook
In the Supabase Dashboard:
- **Database → Webhooks → Create a new webhook**
- Name: `notify-admin-on-signup`
- Table: `profiles`
- Events: `Insert`
- Type: **Supabase Edge Functions** → select `notify-admin`
- Save.

That's it — every new signup now triggers an email to info@crscentral.com with Approve/Reject buttons.

---

## Option A — Push straight to GitHub, deploy on Vercel (recommended, easiest)

1. **Create a new GitHub repository** (e.g. `ratepulse`), don't initialize it with a README (this folder already has one).
2. In this project folder, run:
   ```bash
   git init
   git add .
   git commit -m "Initial RatePulse build"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/ratepulse.git
   git push -u origin main
   ```
3. Go to **vercel.com** → New Project → import your `ratepulse` GitHub repo → it will auto-detect Vite → click **Deploy**.
4. Once deployed, go to your Vercel project → Settings → Domains → add `ratepulse.crscentral.com` (you'll also need to add a CNAME record at your domain registrar pointing to Vercel — Vercel shows you the exact record to add).
5. Done — every future `git push` to `main` auto-redeploys.

## Option B — Netlify instead of Vercel
Same idea: push to GitHub, then netlify.com → Add new site → Import from GitHub → build command `npm run build`, publish directory `dist`.

## Running it locally first (optional but recommended before deploying)
```bash
npm install
npm run dev
```
Opens at `http://localhost:5173`. Sign in with your email (the one you set as admin above) to test the full flow.

## Project structure
```
src/
  lib/
    supabaseClient.js   ← Supabase connection (already configured)
    seedData.js          ← mock data — swap for a real rates API later
  components/
    AuthGate.jsx          ← login + approval-pending screens
    AdminApprovals.jsx    ← admin panel to approve/reject users
    Sidebar.jsx
    ui.jsx                ← shared Card/Badge/KPICard/etc.
  pages/
    Dashboard.jsx, Comparison.jsx, Parity.jsx, Heatmap.jsx,
    Recommendations.jsx, Alerts.jsx, Properties.jsx, Export.jsx
  App.jsx
  main.jsx
```

## Next steps once this is live
1. **Real OTA rate data** — replace `lib/seedData.js` functions with real API calls once you've connected a licensed rate-intelligence provider (OTA Insight, RateGain, Fornova) — the page components don't need to change, only this file.
2. **Email deliverability** — connect a real SMTP sender in Supabase (Project → Auth → SMTP Settings) so magic-link emails land reliably instead of using Supabase's default limited sender.
3. **Custom domain** — point `ratepulse.crscentral.com` at your Vercel/Netlify deployment (see Option A step 4).
