"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, Settings, ShieldCheck, Users, Loader2 } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { ROLE_LABELS } from "@/lib/roles";
import { cn } from "@/lib/utils";

function initials(name: string | null, email: string) {
  if (name) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  }
  return email.slice(0, 2);
}

export function UserMenu() {
  const { profile, loading, signOut, can } = useAuth();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOut();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl px-2 py-2">
        <div className="h-8 w-8 animate-pulse rounded-full bg-zinc-200 dark:bg-zinc-700" />
        <div className="flex-1 space-y-1.5">
          <div className="h-2.5 w-24 animate-pulse rounded bg-zinc-200 dark:bg-zinc-700" />
          <div className="h-2 w-16 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 rounded-xl bg-[#0b3b2e] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#0f4a39]"
      >
        Sign in
      </Link>
    );
  }

  const displayName = profile.fullName || profile.email.split("@")[0];

  return (
    <div ref={containerRef} className="relative">
      {open ? (
        <div className="absolute bottom-full left-0 right-0 z-40 mb-2 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
            <div className="truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
              {displayName}
            </div>
            <div className="truncate text-[10px] text-zinc-500">{profile.email}</div>
          </div>
          <div className="p-1.5">
            {can("users:read") ? (
              <Link
                href="/settings/users"
                onClick={() => setOpen(false)}
                className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                <Users size={14} /> User management
              </Link>
            ) : null}
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[12px] text-zinc-600 transition hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              <Settings size={14} /> Settings
            </Link>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12px] text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:hover:bg-red-950/40"
            >
              {signingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 bg-white px-2.5 py-2 text-left transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-semibold uppercase text-white">
          {initials(profile.fullName, profile.email)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[12px] font-semibold text-zinc-800 dark:text-zinc-100">
            {displayName}
          </span>
          <span className="mt-0.5 flex items-center gap-1 text-[10px] text-zinc-500">
            <ShieldCheck size={10} />
            {ROLE_LABELS[profile.role] ?? "Viewer"}
            {profile.status === "pending" ? (
              <span className="rounded-full bg-amber-100 px-1.5 py-px text-[9px] font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                Pending
              </span>
            ) : null}
          </span>
        </span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-zinc-400 transition", open ? "rotate-180" : "")}
        />
      </button>
    </div>
  );
}
