"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
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

export default function ResetPasswordPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setChecking(false);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setChecking(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setHasSession(true);
        setChecking(false);
      }
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

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

    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(mapAuthError(updateError.message));
        return;
      }
      setDone(true);
    } catch (err) {
      setError(mapAuthError(err instanceof Error ? err.message : "Unable to update your password."));
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f4f6f9]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
      </div>
    );
  }

  if (!hasSession) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <KeyRound size={26} />
          </div>
          <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0a1a2b]">
            Reset link expired
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            This password reset link is invalid or has already been used. Request a new link to
            continue.
          </p>
        </div>
        <div className="mt-6 space-y-2">
          <Link
            href="/forgot-password"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
          >
            Request a new link <ArrowRight size={15} />
          </Link>
          <Link
            href="/login"
            className="inline-flex w-full items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Back to sign in
          </Link>
        </div>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="mt-5 text-[26px] font-semibold tracking-[-0.02em] text-[#0a1a2b]">
            Password updated
          </h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Your new password is active. You can continue to your dashboard now.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            router.replace("/");
            router.refresh();
          }}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f4a39]"
        >
          Continue to dashboard <ArrowRight size={15} />
        </button>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <AuthHeader
        eyebrow="Account security"
        title="Choose a new password"
        subtitle="Use a strong password you have not used before. You will stay signed in after updating it."
      />

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <form onSubmit={submit} className="space-y-4" noValidate>
        <Field label="New password" htmlFor="password">
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            placeholder="Enter a new password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={loading}
          />
          {password ? <PasswordStrength password={password} /> : null}
        </Field>

        <Field label="Confirm new password" htmlFor="confirmPassword">
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Re-enter your new password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            disabled={loading}
          />
          {confirmPassword && confirmPassword !== password ? (
            <p className="text-[11px] text-red-600">Passwords do not match.</p>
          ) : null}
        </Field>

        <AuthButton type="submit" loading={loading} loadingLabel="Updating password…">
          Update password <ArrowRight size={16} />
        </AuthButton>
      </form>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 px-3.5 py-3 text-[11px] leading-5 text-zinc-500">
        <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-600" />
        <span>
          Password changes are protected by Supabase Auth. Existing sessions on other devices may
          need to sign in again.
        </span>
      </div>
    </AuthShell>
  );
}
