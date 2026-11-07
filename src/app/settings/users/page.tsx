"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Crown,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  UserCog,
  Users,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_DESCRIPTIONS, ROLE_LABELS, ROLES, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

type UserRow = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: "pending" | "active" | "suspended";
  createdAt: string;
  updatedAt: string;
};

const STATUS_STYLES: Record<UserRow["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900",
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900",
  suspended: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900",
};

const ROLE_STYLES: Record<Role, string> = {
  super_admin: "bg-[#0b3b2e] text-white",
  admin: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  accountant: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  operations: "bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-200",
  viewer: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
};

function initials(row: UserRow) {
  if (row.fullName) {
    const parts = row.fullName.trim().split(/\s+/);
    return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return row.email.slice(0, 2).toUpperCase();
}

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("en-AU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export default function UsersPage() {
  const { profile: me, loading: authLoading, can } = useAuth();
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  const canManage = can("users:manage");
  const canRead = can("users:read");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/users", { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Unable to load users.");
        setRows([]);
        return;
      }
      setRows(data.profiles ?? []);
    } catch {
      setError("Unable to reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && canRead) load();
    if (!authLoading && !canRead) setLoading(false);
  }, [authLoading, canRead, load]);

  const update = async (id: string, patch: { role?: Role; status?: UserRow["status"] }) => {
    setBusyId(id);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setError(data?.error ?? "Unable to update this user.");
        return;
      }
      setRows((current) => current.map((row) => (row.id === id ? data.profile : row)));
      setNotice("User updated successfully.");
    } catch {
      setError("Unable to update this user right now.");
    } finally {
      setBusyId(null);
    }
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) =>
      [row.fullName, row.email, row.role, row.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(query),
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      admins: rows.filter((row) => row.role === "super_admin" || row.role === "admin").length,
      active: rows.filter((row) => row.status === "active").length,
    }),
    [rows],
  );

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!canRead) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-lg rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40">
            <AlertCircle size={22} />
          </div>
          <h1 className="mt-4 text-lg font-semibold">Administrator access required</h1>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Your current role ({me ? ROLE_LABELS[me.role] : "Viewer"}) cannot view user management.
            Contact a Super Admin if you need access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <ShieldCheck size={14} /> Access control
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Users &amp; Roles</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">
            Manage workspace members, approve pending accounts and assign role-based permissions.
            {canManage
              ? " As a Super Admin you can assign any role."
              : " Only a Super Admin can change roles or account status."}
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total users", value: stats.total, icon: Users },
          { label: "Active", value: stats.active, icon: CheckCircle2 },
          { label: "Pending approval", value: stats.pending, icon: Clock3 },
          { label: "Administrators", value: stats.admins, icon: Crown },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-medium uppercase tracking-wide">{card.label}</span>
                <Icon size={15} />
              </div>
              <div className="mt-2 text-2xl font-semibold tracking-tight">{card.value}</div>
            </div>
          );
        })}
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}
      {notice ? (
        <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <UserCog size={16} className="text-emerald-600" /> Workspace members
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name, email, role…"
              className="w-64 rounded-lg border border-zinc-200 bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-[11px] uppercase tracking-wide text-zinc-500 dark:bg-zinc-950/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Member</th>
                <th className="px-4 py-3 text-left font-medium">Role</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Joined</th>
                {canManage ? <th className="px-4 py-3 text-right font-medium">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index} className="border-t border-zinc-100 dark:border-zinc-800">
                    <td colSpan={canManage ? 5 : 4} className="px-4 py-4">
                      <div className="h-8 animate-pulse rounded-lg bg-zinc-100 dark:bg-zinc-800" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={canManage ? 5 : 4} className="px-4 py-12 text-center text-sm text-zinc-500">
                    {rows.length === 0
                      ? "No users yet. The first registered account becomes Super Admin."
                      : "No users match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => {
                  const isMe = row.id === me?.id;
                  const busy = busyId === row.id;
                  return (
                    <tr
                      key={row.id}
                      className="border-t border-zinc-100 transition hover:bg-zinc-50/70 dark:border-zinc-800 dark:hover:bg-zinc-800/30"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-semibold text-white">
                            {initials(row)}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 truncate font-medium">
                              {row.fullName || row.email.split("@")[0]}
                              {isMe ? (
                                <span className="rounded-full bg-zinc-100 px-1.5 py-px text-[9px] font-medium text-zinc-500 dark:bg-zinc-800">
                                  You
                                </span>
                              ) : null}
                            </div>
                            <div className="truncate text-[11px] text-zinc-500">{row.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            ROLE_STYLES[row.role],
                          )}
                          title={ROLE_DESCRIPTIONS[row.role]}
                        >
                          {ROLE_LABELS[row.role]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize",
                            STATUS_STYLES[row.status],
                          )}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-[12px] text-zinc-500">
                        {formatDate(row.createdAt)}
                      </td>
                      {canManage ? (
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            {busy ? <Loader2 size={14} className="animate-spin text-emerald-600" /> : null}
                            <select
                              value={row.role}
                              disabled={busy || isMe}
                              title={isMe ? "You cannot change your own role" : undefined}
                              onChange={(event) =>
                                update(row.id, { role: event.target.value as Role })
                              }
                              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                              aria-label={`Role for ${row.email}`}
                            >
                              {ROLES.map((role) => (
                                <option key={role} value={role}>
                                  {ROLE_LABELS[role]}
                                </option>
                              ))}
                            </select>
                            <select
                              value={row.status}
                              disabled={busy || isMe}
                              title={isMe ? "You cannot change your own status" : undefined}
                              onChange={(event) =>
                                update(row.id, {
                                  status: event.target.value as UserRow["status"],
                                })
                              }
                              className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-[11px] capitalize outline-none focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900"
                              aria-label={`Status for ${row.email}`}
                            >
                              <option value="pending">Pending</option>
                              <option value="active">Active</option>
                              <option value="suspended">Suspended</option>
                            </select>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck size={15} className="text-emerald-600" /> Role permissions
        </h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((role) => (
            <div key={role} className="rounded-xl border border-zinc-100 px-3 py-2.5 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", ROLE_STYLES[role])}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="mt-1.5 text-[11px] leading-5 text-zinc-500">{ROLE_DESCRIPTIONS[role]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
