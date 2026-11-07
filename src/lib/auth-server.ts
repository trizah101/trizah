import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { prisma } from "./prisma";
import { createSupabaseServerClient } from "./supabase/server";
import { isSupabaseConfigured } from "./supabase/config";
import { isRole, type Role } from "./roles";

export type AuthProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: Role;
  status: "pending" | "active" | "suspended";
};

export type AuthContext = {
  user: User;
  profile: AuthProfile;
};

function bootstrapSuperAdmins(): string[] {
  return (process.env.SUPER_ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Resolve the application profile for an authenticated Supabase user.
 * Creates a safe default profile if the database trigger has not run yet.
 */
async function resolveProfile(user: User): Promise<AuthProfile | null> {
  if (!user.email) return null;
  const email = user.email.toLowerCase();
  const fullName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  let profile = await prisma.profile.findUnique({ where: { id: user.id } });

  if (!profile) {
    // Race-safe fallback for projects where the auth trigger has not been
    // installed yet. Never grants elevated access.
    profile = await prisma.profile.upsert({
      where: { id: user.id },
      update: {},
      create: {
        id: user.id,
        email,
        fullName,
        role: "viewer",
        status: "pending",
      },
    });
  }

  // Explicit bootstrap list (comma separated) always wins. This lets the
  // project owner become Super Admin without ever using the service-role key.
  if (bootstrapSuperAdmins().includes(email) && profile.role !== "super_admin") {
    profile = await prisma.profile.update({
      where: { id: profile.id },
      data: { role: "super_admin", status: "active" },
    });
  }

  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    role: isRole(profile.role) ? profile.role : "viewer",
    status:
      profile.status === "active" || profile.status === "suspended" ? profile.status : "pending",
  };
}

/**
 * Read the current session and profile. Cached per request so a page can call
 * it from several components without hitting Supabase repeatedly.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) return null;

    const profile = await resolveProfile(user);
    if (!profile) return null;

    return { user, profile };
  } catch {
    return null;
  }
});

export async function getCurrentProfile(): Promise<AuthProfile | null> {
  const ctx = await getAuthContext();
  return ctx?.profile ?? null;
}
