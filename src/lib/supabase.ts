import { createClient as createSupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env?.VITE_SUPABASE_URL;
const anonKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

export const supabase =
  url && anonKey && typeof url === "string" && typeof anonKey === "string"
    ? createSupabaseClient(url, anonKey)
    : null;

export function isSupabaseEnabled(): boolean {
  return supabase != null;
}
