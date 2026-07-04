import { createClient } from "@supabase/supabase-js";

// Public-safe anon key — scoped entirely by Row Level Security policies.
// Never put a service-role key here.
const SUPABASE_URL = "https://xpaqhutincnnvjljyroe.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_lRjrDwIi71Hi7Fwb4LoXPQ_twErJf-C";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
