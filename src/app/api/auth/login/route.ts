import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return NextResponse.json({ ok: true });
  const body = await req.json();
  if (body?.password !== appPassword) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const secret = process.env.SESSION_SECRET || "";
  const res = NextResponse.json({ ok: true });
  res.cookies.set("trizah_session", secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("trizah_session");
  return res;
}