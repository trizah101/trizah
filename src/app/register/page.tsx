"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MailCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { AuthHeader, AuthShell } from "@/components/auth/AuthShell";
import {
  AuthAlert,
  AuthButton,
  Field,
  PasswordInput,
  PasswordStrength,
  inputClass,
  mapAuthError,
  passwordScore,
} from "@/components/auth/AuthForm";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function redirectUrl() {
  const next = encodeURIComponent("/verify-email?verified=1");
  return `${window.location.origin}/auth/callback?next=${next}`;
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = window.setTimeout(() => setCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [cooldown]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (fullName.trim().length < 2) {
      setError("Enter your full name.");
      return;
    }
    if (!EMAIL_RE.test(email.trim())) {
      setError("Enter a valid work email address.");
      return;
    }
    if (password.length < 8) {
      setError("Use a password with at least 8 characters.");
      return;
    }
    if (passwordScore(password) < 2) {
      setError("Choose a stronger password. Mix upper and lowercase letters with a number.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!terms) {
      setError("Please accept the Terms of Service and Privacy Policy to continue.");
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
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: { full_name: fullName.trim() },
          emailRedirectTo: redirectUrl(),
        },
      });

      if (signUpError) {
        setError(mapAuthError(signUpError.message));
        return;
      }

      if (data.session) {
        // Email confirmation is disabled in the Supabase project.
        router.replace("/");
        router.refresh();
        return;
      }

      setSentTo(email.trim().toLowerCase());
      setCooldown(60);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Unable to create your account."));
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!sentTo || cooldown > 0 || !isSupabaseConfigured()) return;
    setResending(true);
    setResendMessage("");
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: sentTo,
        options: { emailRedirectTo: redirectUrl() },
      });
      if (resendError) {
        setResendMessage(mapAuthError(resendError.message));
      } else {
        setResendMessage("Verification email sent again. Check your inbox and spam folder.");
        setCooldown(60);
      }
    } catch {
      setResendMessage("Unable to resend the email right now. Please try again shortly.");
    } finally {
      setResending(false);
    }
  };

  if (sentTo) {
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
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <MailCheck size={26} />
          </div>
          <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0a1a2b]">
            Verify your email
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            We sent a verification link to <span className="font-medium text-zinc-800">{sentTo}</span>.
            Click the link to activate your TRIZAH account.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-zinc-100 bg-zinc-50/80 px-4 py-3 text-left text-[11px] leading-5 text-zinc-500">
          Your new account starts with <span className="font-semibold text-zinc-700">Viewer</span>{" "}
          access and is marked pending approval. A Super Admin can upgrade your role once your email
          is verified.
        </div>

        {resendMessage ? (
          <div className="mt-4">
            <AuthAlert variant={resendMessage.startsWith("Verification email") ? "success" : "error"}>
              {resendMessage}
            </AuthAlert>
          </div>
        ) : null}

        <div className="mt-5 space-y-2">
          <button
            type="button"
            onClick={resend}
            disabled={resending || cooldown > 0}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} className={resending ? "animate-spin" : ""} />
            {cooldown > 0 ? `Resend available in ${cooldown}s` : "Resend verification email"}
          </button>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
          >
            Continue to sign in <ArrowRight size={15} />
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      footer={
        <p className="mt-5 text-center text-[13px] text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-[#0b3b2e] hover:text-emerald-600">
            Sign in
          </Link>
        </p>
      }
    >
      <AuthHeader
        eyebrow="Create your workspace"
        title="Start with TRIZAH"
        subtitle="Create your account to access multi-currency accounting, FBA costs and financial reporting."
      />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="Full name" htmlFor="fullName">
          <input
            id="fullName"
            name="fullName"
            type="text"
            autoComplete="name"
            placeholder="Your full name"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            className={inputClass}
            required
            disabled={loading}
          />
        </Field>

        <Field label="Work email" htmlFor="email">
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

        <Field label="Password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
          {password ? <PasswordStrength password={password} /> : null}
        </Field>

        <Field label="Confirm password" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={loading}
          />
          {confirmPassword && confirmPassword !== password ? (
            <p className="text-[11px] text-red-600">Passwords do not match.</p>
          ) : null}
        </Field>

        <label className="flex cursor-pointer items-start gap-2.5 pt-0.5 text-[12px] leading-5 text-zinc-600">
          <input
            type="checkbox"
            checked={terms}
            onChange={(event) => setTerms(event.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-emerald-600 focus:ring-emerald-500"
          />
          <span>
            I agree to the <span className="font-medium text-zinc-800">Terms of Service</span> and{" "}
            <span className="font-medium text-zinc-800">Privacy Policy</span>, and understand that
            access is subject to administrator approval.
          </span>
        </label>

        <AuthButton type="submit" loading={loading} loadingLabel="Creating your account…">
          Create account <ArrowRight size={16} />
        </AuthButton>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-[11px] leading-5 text-zinc-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
        <span>
          New registrations default to Viewer access. Administrative roles can only be assigned by a
          Super Admin.
        </span>
      </div>
    </AuthShell>
  );
}
