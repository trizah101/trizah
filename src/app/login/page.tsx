"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { AuthHeader, AuthShell } from "@/components/auth/AuthShell";
import {
  AuthAlert,
  AuthButton,
  Field,
  PasswordInput,
  inputClass,
  mapAuthError,
} from "@/components/auth/AuthForm";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function safeNext(value: string | null): string {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    const remembered = window.localStorage.getItem("trizah_remember_email");
    if (remembered) {
      setEmail(remembered);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    const errorParam = params.get("error");
    if (errorParam === "not_configured") {
      setError(
        "Authentication is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
    } else if (errorParam) {
      setError(mapAuthError(decodeURIComponent(errorParam)));
    }

    if (params.get("expired") === "1") {
      setInfo("Your session has expired for security. Please sign in again.");
    }
    if (params.get("registered") === "1") {
      setInfo("Account created. Check your inbox to verify your email, then sign in.");
    }
    if (params.get("verified") === "1") {
      setInfo("Your email has been verified. You can sign in now.");
    }
    if (params.get("reset") === "1") {
      setInfo("Your password was updated. Sign in with your new password.");
    }
  }, [params]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!email.trim() || !password) {
      setError("Enter your email address and password to continue.");
      return;
    }
    if (!isSupabaseConfigured()) {
      setError(
        "Authentication is not configured on this deployment. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message));
        return;
      }

      // Reject suspended accounts before letting them into the workspace.
      const meResponse = await fetch("/api/auth/me", { cache: "no-store" });
      const me = await meResponse.json().catch(() => null);
      if (me?.profile?.status === "suspended") {
        await supabase.auth.signOut();
        await fetch("/api/auth/signout", { method: "POST" });
        setError("This account has been suspended. Contact your administrator.");
        return;
      }

      if (remember) {
        window.localStorage.setItem("trizah_remember_email", email.trim().toLowerCase());
      } else {
        window.localStorage.removeItem("trizah_remember_email");
      }

      router.replace(safeNext(params.get("next")));
      router.refresh();
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Unable to sign in right now."));
    } finally {
      setLoading(false);
    }
  };

  const configured = isSupabaseConfigured();

  return (
    <AuthShell
      footer={
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          New to TRIZAH?{" "}
          <Link href="/register" className="font-semibold text-[#0b3b2e] hover:text-emerald-600">
            Create an account
          </Link>
        </p>
      }
    >
      <AuthHeader
        eyebrow="Secure sign in"
        title="Welcome back"
        subtitle="Sign in to your financial command center to manage balances, suppliers, shipments and Amazon performance."
      />

      {!configured ? (
        <AuthAlert variant="error">
          Authentication is not configured. Add <code className="font-mono">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="font-mono">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to the environment.
        </AuthAlert>
      ) : null}

      {info ? <AuthAlert variant="success">{info}</AuthAlert> : null}
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Email address" htmlFor="email">
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="you@company.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
            required
            disabled={loading}
          />
        </Field>

        <Field
          label="Password"
          htmlFor="password"
          hint={
            <Link
              href="/forgot-password"
              className="text-[11px] font-medium text-[#0b3b2e] hover:text-emerald-600"
            >
              Forgot password?
            </Link>
          }
        >
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-2.5 pt-0.5 text-[12px] text-zinc-600">
          <input
            type="checkbox"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 accent-emerald-600 focus:ring-emerald-500"
          />
          Remember me on this device
        </label>

        <AuthButton type="submit" loading={loading} loadingLabel="Signing you in…">
          Sign in to dashboard
          <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
        </AuthButton>
      </form>

      <div className="mt-6 flex items-center gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-[11px] leading-5 text-zinc-500">
        <ShieldCheck size={15} className="shrink-0 text-emerald-600" />
        <span>
          Protected by Supabase Auth. Sessions are encrypted and access is governed by your assigned
          role.
        </span>
      </div>
    </AuthShell>
  );
}

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
