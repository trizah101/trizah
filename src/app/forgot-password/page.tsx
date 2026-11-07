"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { AuthHeader, AuthShell } from "@/components/auth/AuthShell";
import {
  AuthAlert,
  AuthButton,
  Field,
  inputClass,
  mapAuthError,
} from "@/components/auth/AuthForm";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter the email address associated with your account.");
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
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo },
      );

      if (resetError) {
        setError(mapAuthError(resetError.message));
        return;
      }

      // Always show the same confirmation to avoid disclosing account existence.
      setSent(true);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Unable to send the reset email."));
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <AuthShell
        footer={
          <p className="mt-5 text-center text-[13px] text-zinc-500">
            <Link href="/login" className="font-semibold text-[#0b3b2e] hover:text-emerald-600">
              Back to sign in
            </Link>
          </p>
        }
      >
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <MailCheck size={26} />
          </div>
          <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0a1a2b]">
            Check your inbox
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            If an account exists for{" "}
            <span className="font-medium text-zinc-800">{email.trim().toLowerCase()}</span>, you will
            receive a secure password reset link shortly.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-left text-[11px] leading-5 text-zinc-500">
          The link expires after a short period for security. If it does not arrive, check your spam
          folder or request a new link.
        </div>

        <Link
          href="/login"
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
        >
          Continue to sign in <ArrowRight size={15} />
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Remembered it?{" "}
          <Link href="/login" className="font-semibold text-[#0b3b2e] hover:text-emerald-600">
            Sign in
          </Link>
        </p>
      }
    >
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-[12px] font-medium text-zinc-500 transition hover:text-zinc-800"
      >
        <ArrowLeft size={14} /> Back to sign in
      </Link>

      <AuthHeader
        eyebrow="Account recovery"
        title="Reset your password"
        subtitle="Enter your work email and we will send you a secure link to choose a new password."
      />

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

        <AuthButton type="submit" loading={loading} loadingLabel="Sending reset link…">
          Send reset link <ArrowRight size={16} />
        </AuthButton>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-[11px] leading-5 text-zinc-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
        <span>
          For your security we never reveal whether an email is registered. Reset links are
          single-use and time-limited.
        </span>
      </div>
    </AuthShell>
  );
}
