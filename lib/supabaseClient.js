import { createBrowserClient } from '@supabase/ssr'

let supabase;

export function createSupabaseBrowserClient() {
  if (supabase) {
    console.log('[SupabaseClient] Returning existing singleton instance');
    return supabase;
  }

  console.log('[SupabaseClient] Creating new singleton instance');
  supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )

  return supabase;
}