"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { useAuth } from "./AuthProvider";
import { isAuthRoute } from "@/lib/auth-routes";
import { Clock3 } from "lucide-react";

function PendingBanner() {
  const { profile, loading } = useAuth();
  if (loading || !profile || profile.status !== "pending") return null;

  return (
    <div className="border-b border-amber-200/70 bg-amber-50 px-4 py-2.5 text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-200 sm:px-6">
      <div className="flex items-start gap-2 text-[12px] leading-5">
        <Clock3 size={15} className="mt-0.5 shrink-0" />
        <p>
          <span className="font-semibold">Your account is pending approval.</span> You have read-only
          Viewer access until a Super Admin assigns your role in User Management.
        </p>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  if (isAuthRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        <PendingBanner />
        {children}
      </main>
    </div>
  );
}
