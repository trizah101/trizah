import { NextResponse } from "next/server";
import { getAuthContext, type AuthContext } from "./auth-server";
import { hasPermission, type Permission } from "./roles";
import { isSupabaseConfigured } from "./supabase/config";

type GuardResult = { ok: true; ctx: AuthContext } | { ok: false; response: NextResponse };

function unconfiguredResponse(): NextResponse {
  return NextResponse.json(
    {
      error:
        "Authentication is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    },
    { status: 503 },
  );
}

/**
 * Require a signed-in user with the given permission for a mutating API call.
 * Returns a NextResponse when the request must be rejected.
 */
export async function guardPermission(permission: Permission): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) return unconfiguredResponse();

  const ctx = await getAuthContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (ctx.profile.status === "suspended") {
    return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
  }
  if (!hasPermission(ctx.profile.role, permission)) {
    return NextResponse.json(
      { error: "You do not have permission to perform this action." },
      { status: 403 },
    );
  }
  return null;
}

/** Require any signed-in, non-suspended user (used for sensitive reads). */
export async function guardAuthenticated(): Promise<NextResponse | null> {
  if (!isSupabaseConfigured()) return unconfiguredResponse();
  const ctx = await getAuthContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.profile.status === "suspended") {
    return NextResponse.json({ error: "This account has been suspended." }, { status: 403 });
  }
  return null;
}

export async function requireAuthContext(): Promise<GuardResult> {
  if (!isSupabaseConfigured()) return { ok: false, response: unconfiguredResponse() };
  const ctx = await getAuthContext();
  if (!ctx) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, ctx };
}
