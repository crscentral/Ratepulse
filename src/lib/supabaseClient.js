import { createClient } from "@supabase/supabase-js";

// Public-safe anon key — scoped entirely by Row Level Security policies.
// Never put a service-role key here.
const SUPABASE_URL = "https://pnxokgsyzrkblgfcbndc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_VR2Xt0QvmwwLf2L8bRricQ_BGW1tCXq";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
