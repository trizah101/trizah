"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, MailCheck, RefreshCw } from "lucide-react";
import { AuthHeader, AuthShell } from "@/components/auth/AuthShell";
import { AuthAlert, Field, inputClass, mapAuthError } from "@/components/auth/AuthForm";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

function VerifyEmailContent() {
  const router = useRouter();
  const params = useSearchParams();

  const verifiedParam = params.get("verified") === "1";
  const [checking, setChecking] = useState(!verifiedParam);
  const [verified, setVerified] = useState(verifiedParam);
  const [email, setEmail] = useState(params.get("email") ?? "");
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  useEffect(() => {
    if (verifiedParam || !isSupabaseConfigured()) {
      setChecking(false);
      return;
    }

    let active = true;
    const supabase = getSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      if (data.user) {
        setVerified(true);
        setEmail(data.user.email ?? "");
      }
      setChecking(false);
    });

    return () => {
      active = false;
    };
  }, [verifiedParam]);

  const resend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || cooldown > 0 || !isSupabaseConfigured()) return;

    setResending(true);
    setMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const next = encodeURIComponent("/verify-email?verified=1");
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim().toLowerCase(),
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${next}` },
      });
      if (error) {
        setMessage(mapAuthError(error.message));
      } else {
        setMessage("Verification email sent. Check your inbox and spam folder.");
        setCooldown(60);
      }
    } catch {
      setMessage("Unable to resend the email right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (verified) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0a1a2b]">
            Email verified
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Your TRIZAH account is active. Continue to the dashboard to start working.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 text-left text-[11px] leading-5 text-emerald-800">
          Your role and permissions are managed by a Super Admin in User Management. You can start
          working now.
        </div>

        <button
          type="button"
          onClick={() => {
            router.replace("/");
            router.refresh();
          }}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
        >
          Continue to dashboard <ArrowRight size={15} />
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Already verified?{" "}
          <Link href="/login" className="font-semibold text-[#0b3b2e] hover:text-emerald-600">
            Sign in
          </Link>
        </p>
      }
    >
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
        <MailCheck size={26} />
      </div>

      <div className="mt-5 text-center">
        <AuthHeader
          title="Check your email"
          subtitle="Open the verification link we sent you to activate your account. If you cannot find it, resend below."
        />
      </div>

      {message ? (
        <AuthAlert variant={message.startsWith("Verification email sent") ? "success" : "error"}>
          {message}
        </AuthAlert>
      ) : null}

      <form onSubmit={resend} className="space-y-4" noValidate>
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
            disabled={resending}
          />
        </Field>

        <button
          type="submit"
          disabled={resending || cooldown > 0}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={15} className={resending ? "animate-spin" : ""} />
          {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
      >
        Back to sign in <ArrowRight size={15} />
      </Link>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
