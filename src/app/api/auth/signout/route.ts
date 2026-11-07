import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export async function POST() {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await createSupabaseServerClient();
      await supabase.auth.signOut();
    } catch {
      // Fall through and clear the legacy cookie below.
    }
  }

  const response = NextResponse.json({ ok: true });
  // Remove the old password-gate cookie if it is still around.
  response.cookies.delete("trizah_session");
  return response;
}
