import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;

const supabaseKey =
  process.env.REACT_APP_SUPABASE_ANON_KEY ||
  process.env.REACT_APP_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase credentials missing. Add REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY to .env",
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseKey || "", {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
