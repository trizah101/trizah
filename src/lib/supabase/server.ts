import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_ANON_KEY, SUPABASE_URL, assertSupabaseConfigured } from "./config";

/**
 * Supabase client for Route Handlers, Server Actions and Server Components.
 * Must be created per request; never cache it across requests.
 */
export async function createSupabaseServerClient() {
  assertSupabaseConfigured();
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet, headers) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
          // @supabase/ssr supplies no-store headers when auth cookies change.
          void headers;
        } catch {
          // Called from a Server Component where cookies are read-only.
          // The proxy is responsible for refreshing the session in that case.
        }
      },
    },
  });
}
