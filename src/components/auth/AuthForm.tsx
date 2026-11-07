"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Alerts                                                                     */
/* -------------------------------------------------------------------------- */

export function AuthAlert({
  variant = "error",
  children,
}: {
  variant?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles = {
    error: "border-red-200 bg-red-50 text-red-700",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-sky-200 bg-sky-50 text-sky-800",
  }[variant];

  const Icon = variant === "error" ? AlertCircle : variant === "success" ? CheckCircle2 : Info;

  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn("mb-5 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] leading-5", styles)}
    >
      <Icon size={16} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Field                                                                      */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={htmlFor} className="text-[12px] font-medium text-zinc-700">
          {label}
        </label>
        {hint}
      </div>
      {children}
    </div>
  );
}

export const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-3.5 py-2.5 text-sm text-zinc-900 shadow-sm outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-zinc-50";

/* -------------------------------------------------------------------------- */
/* Password input                                                             */
/* -------------------------------------------------------------------------- */

type PasswordInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  showToggle?: boolean;
};

export function PasswordInput({ className, showToggle = true, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        {...props}
        type={visible ? "text" : "password"}
        className={cn(inputClass, showToggle && "pr-11", className)}
      />
      {showToggle ? (
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Password strength                                                          */
/* -------------------------------------------------------------------------- */

export function passwordScore(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return Math.min(4, score);
}

const STRENGTH = [
  { label: "Too short", color: "bg-red-400", text: "text-red-600" },
  { label: "Weak", color: "bg-red-400", text: "text-red-600" },
  { label: "Fair", color: "bg-amber-400", text: "text-amber-600" },
  { label: "Good", color: "bg-lime-500", text: "text-lime-600" },
  { label: "Strong", color: "bg-emerald-500", text: "text-emerald-600" },
];

export function PasswordStrength({ password }: { password: string }) {
  const score = passwordScore(password);
  const meta = STRENGTH[score];

  const checks = [
    { label: "8+ characters", pass: password.length >= 8 },
    { label: "Upper & lowercase", pass: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: "A number", pass: /\d/.test(password) },
    { label: "A symbol", pass: /[^A-Za-z0-9]/.test(password) },
  ];

  return (
    <div className="mt-2.5 space-y-2">
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-200">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                score > index ? meta.color : "bg-transparent",
              )}
            />
          </div>
        ))}
        <span className={cn("ml-1 w-16 text-right text-[10px] font-medium", password ? meta.text : "text-zinc-400")}>
          {password ? meta.label : "Strength"}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map((check) => (
          <span
            key={check.label}
            className={cn(
              "inline-flex items-center gap-1 text-[10px]",
              check.pass ? "text-emerald-600" : "text-zinc-400",
            )}
          >
            <span
              className={cn(
                "flex h-3 w-3 items-center justify-center rounded-full border text-[7px]",
                check.pass ? "border-emerald-500 bg-emerald-500 text-white" : "border-zinc-300",
              )}
            >
              {check.pass ? "✓" : ""}
            </span>
            {check.label}
          </span>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Submit button                                                              */
/* -------------------------------------------------------------------------- */

export function AuthButton({
  children,
  loading,
  loadingLabel = "Please wait…",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  loadingLabel?: string;
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={cn(
        "group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(11,59,46,0.7)] transition hover:bg-[#0f4a39] focus:outline-none focus:ring-4 focus:ring-emerald-600/15 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 size={16} className="animate-spin" />
          {loadingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

export function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "The email or password you entered is incorrect.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please verify your email address before signing in. Check your inbox for the confirmation link.";
  }
  if (normalized.includes("user already registered") || normalized.includes("already been registered")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (normalized.includes("password should be at least")) {
    return "Your password is too short. Use at least 8 characters.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a moment and try again.";
  }
  if (normalized.includes("fetch") || normalized.includes("network")) {
    return "We could not reach the authentication service. Check your connection and try again.";
  }
  if (normalized.includes("email address") && normalized.includes("invalid")) {
    return "Please enter a valid email address.";
  }
  return message;
}
