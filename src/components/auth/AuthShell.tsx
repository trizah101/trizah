import Link from "next/link";
import type { ReactNode } from "react";
import { ShieldCheck, LockKeyhole, Fingerprint } from "lucide-react";

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/25">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#071322]" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M5 6.5h14" />
          <path d="M12 6.5V18" />
          <circle cx="12" cy="18" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </div>
      <div>
        <div className={`font-semibold tracking-[0.22em] ${compact ? "text-sm text-[#071322]" : "text-base text-white"}`}>
          TRIZAH
        </div>
        <div className={`whitespace-nowrap text-[9px] uppercase tracking-[0.28em] ${compact ? "text-zinc-400" : "text-white/45"}`}>
          Financial Operations
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  const bars = [38, 52, 44, 66, 58, 78, 71, 88, 82, 96, 90, 100];
  return (
    <div className="relative mt-10">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/20 blur-2xl" />
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.045] p-5 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">Total cash balance</div>
            <div className="mt-1.5 flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight text-white">A$184,920.50</span>
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] font-medium text-emerald-300">
                +12.4%
              </span>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] text-white/60">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="mt-5 flex h-24 items-end gap-1.5">
          {bars.map((height, index) => (
            <div key={index} className="flex h-full flex-1 items-end overflow-hidden rounded-sm bg-white/5">
              <div
                className={`w-full rounded-sm ${index > 8 ? "bg-gradient-to-t from-emerald-600 to-emerald-300" : "bg-white/20"}`}
                style={{ height: `${height}%` }}
              />
            </div>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-4 gap-2">
          {[
            { code: "AUD", value: "92,410", tone: "text-emerald-300" },
            { code: "BDT", value: "3.2M", tone: "text-white/80" },
            { code: "RMB", value: "418K", tone: "text-white/80" },
            { code: "USD", value: "28.6K", tone: "text-white/80" },
          ].map((item) => (
            <div key={item.code} className="rounded-lg border border-white/8 bg-white/[0.035] px-2 py-2">
              <div className="text-[9px] tracking-wide text-white/35">{item.code}</div>
              <div className={`mt-0.5 text-[11px] font-medium ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute -bottom-16 -left-4 flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-[#0d2033] px-3 py-2 shadow-xl">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-400/15">
          <ShieldCheck size={13} className="text-emerald-300" />
        </span>
        <div>
          <div className="text-[10px] font-medium text-white">Reconciled</div>
          <div className="text-[9px] text-white/40">All wallets balanced</div>
        </div>
      </div>
    </div>
  );
}

export function AuthShell({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-[#f4f6f9] lg:grid lg:grid-cols-[1.06fr_1fr]">
      <aside className="relative hidden min-h-screen flex-col justify-between overflow-hidden bg-[#071322] px-12 py-10 lg:flex xl:px-16">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-500/12 blur-[100px]" />
          <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky-500/10 blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage: "radial-gradient(ellipse at 30% 20%, black, transparent 75%)",
            }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/login" className="inline-flex">
            <Logo />
          </Link>
        </div>

        <div className="relative z-10 max-w-[660px] py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/50">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Multi-currency accounting · Amazon FBA
          </span>

          <h1 className="mt-7 text-[38px] font-semibold leading-[1.06] tracking-[-0.03em] text-white xl:text-[48px]">
            Manage Your Business.
            <br />
            <span className="bg-gradient-to-r from-emerald-300 to-emerald-500 bg-clip-text text-transparent">
              Master Your Numbers.
            </span>
          </h1>

          <p className="mt-5 max-w-md text-sm leading-7 text-white/55">
            One intelligent platform to manage your multi-currency finances, Amazon FBA
            operations, inventory costs and business performance.
          </p>

          <DashboardPreview />
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-white/35">
          <span className="inline-flex items-center gap-1.5">
            <LockKeyhole size={12} /> 256-bit encrypted
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Fingerprint size={12} /> Supabase Auth
          </span>
          <span>Role-based access control</span>
        </div>
      </aside>

      <main className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
          <div className="lg:hidden">
            <Logo compact />
          </div>
          <div className="ml-auto hidden text-[11px] text-zinc-500 sm:block">
            Need help?{" "}
            <a href="mailto:support@trizah.com" className="font-medium text-[#0b3b2e] hover:text-emerald-600">
              Contact support
            </a>
          </div>
        </header>

        <div className="flex flex-1 items-center justify-center px-4 pb-10 pt-2 sm:px-8">
          <div className="w-full max-w-[440px]">
            <div className="rounded-[28px] border border-zinc-200/80 bg-white p-6 shadow-[0_30px_90px_-40px_rgba(7,19,34,0.45)] sm:p-8">
              {children}
            </div>
            {footer}
            <p className="mt-6 text-center text-[10px] tracking-wide text-zinc-400">
              © TRIZAH · Secure financial workspace
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export function AuthHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {eyebrow}
        </div>
      ) : null}
      <h2 className="text-[26px] font-semibold leading-tight tracking-[-0.02em] text-[#0a1a2b]">
        {title}
      </h2>
      {subtitle ? <p className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</p> : null}
    </div>
  );
}
