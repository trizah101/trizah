import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "@/lib/supabase/config";

/**
 * Routes that must be reachable without a session.
 * `/reset-password` needs to be public because the recovery link establishes
 * the session via `/auth/callback` before landing there.
 */
const PUBLIC_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/auth",
  "/api/auth",
];

/** Signed-in users are redirected away from these pages. */
const AUTH_ENTRY_PAGES = ["/login", "/register", "/forgot-password"];

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const publicRoute = isPublic(pathname);

  // Without configuration we fail closed for app routes so financial data is
  // never accidentally exposed. Auth pages still render a setup message.
  if (!isSupabaseConfigured()) {
    if (publicRoute || pathname.startsWith("/api/auth")) return NextResponse.next();
    if (pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: "Authentication is not configured on this deployment." },
        { status: 503 },
      );
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    url.searchParams.set("error", "not_configured");
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        Object.entries(headers ?? {}).forEach(([key, value]) => {
          response.headers.set(key, value);
        });
      },
    },
  });

  // IMPORTANT: getUser() validates the JWT with Supabase and refreshes the
  // session cookie when needed. Do not rely on getSession() in the proxy.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (publicRoute) {
    if (user && AUTH_ENTRY_PAGES.includes(pathname)) {
      return NextResponse.redirect(new URL(safeNext(request.nextUrl.searchParams.get("next")), request.url));
    }
    return response;
  }

  if (!user) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const hadSession = request.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));

    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    if (pathname !== "/") url.searchParams.set("next", pathname);
    if (hadSession) url.searchParams.set("expired", "1");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)"],
};
