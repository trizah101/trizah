"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { hasPermission, type Permission, type Role } from "@/lib/roles";
import { isAuthRoute } from "@/lib/auth-routes";

export type AuthProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: "pending" | "active" | "suspended";
};

type AuthContextValue = {
  profile: AuthProfile | null;
  loading: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
  can: (permission: Permission) => boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const signingOut = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      setProfile(data?.profile ?? null);
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    signingOut.current = true;
    try {
      await fetch("/api/auth/signout", { method: "POST" });
      if (isSupabaseConfigured()) {
        await getSupabaseBrowserClient().auth.signOut();
      }
    } catch {
      // Best effort: the server cookie is already cleared.
    }
    setProfile(null);
    router.replace("/login");
    router.refresh();
  }, [router]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Re-validate when the tab regains focus (catches expired sessions).
  useEffect(() => {
    const onFocus = () => {
      if (!isAuthRoute(window.location.pathname)) refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  // React to Supabase session events (sign-out, token expiry, recovery).
  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = getSupabaseBrowserClient();

    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        setProfile(null);
        if (!isAuthRoute(window.location.pathname) && !signingOut.current) {
          router.replace("/login?expired=1");
        }
      }
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
        signingOut.current = false;
        refresh();
      }
    });

    return () => data.subscription.unsubscribe();
  }, [refresh, router]);

  // A suspended account must not keep a usable session.
  useEffect(() => {
    if (profile?.status === "suspended" && !signingOut.current) {
      void signOut();
    }
  }, [profile?.status, signOut]);

  // Refresh profile when navigating between app pages.
  useEffect(() => {
    if (!isAuthRoute(pathname)) refresh();
  }, [pathname, refresh]);

  const can = useCallback(
    (permission: Permission) => hasPermission(profile?.role, permission),
    [profile?.role],
  );

  return (
    <AuthContext.Provider value={{ profile, loading, refresh, signOut, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
