import { createClient } from "@supabase/supabase-js";

// Build-time fallback: prevent "supabaseUrl is required" during prerender
// when env vars are missing (e.g. Vercel build without env config).
// Real values must be set as NEXT_PUBLIC_SUPABASE_URL / _ANON_KEY for runtime.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

if (
  typeof window !== "undefined" &&
  (supabaseUrl === "https://placeholder.supabase.co" ||
    supabaseAnonKey === "placeholder-anon-key")
) {
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env eksik. NEXT_PUBLIC_SUPABASE_URL ve NEXT_PUBLIC_SUPABASE_ANON_KEY ayarlanmalı (Vercel: Settings → Environment Variables; lokal: .env.local).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
