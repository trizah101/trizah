import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getAuthContext } from "@/lib/auth-server";

export async function GET() {
  // Force request-time rendering so a session is never baked into the build.
  await cookies();
  const ctx = await getAuthContext();

  if (!ctx) {
    return NextResponse.json({ user: null, profile: null }, { status: 200 });
  }

  return NextResponse.json({
    user: { id: ctx.user.id, email: ctx.user.email },
    profile: ctx.profile,
  });
}
