"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./config";

/**
 * Browser Supabase client. Sessions are stored in cookies by @supabase/ssr so
 * that the Next.js proxy and server components can read them.
 */
export function getSupabaseBrowserClient() {
  assertSupabaseConfigured();
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}
