import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardPermission } from "@/lib/api-auth";
import { isRole, STATUSES } from "@/lib/roles";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  // Only a Super Admin may assign roles or change account status.
  const denied = await guardPermission("users:manage");
  if (denied) return denied;

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as
    | { role?: unknown; status?: unknown }
    | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const target = await prisma.profile.findUnique({ where: { id } });
  if (!target) {
    return NextResponse.json({ error: "User not found." }, { status: 404 });
  }

  const data: { role?: string; status?: string } = {};

  if (body.role !== undefined) {
    if (!isRole(body.role)) {
      return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    }
    data.role = body.role;
  }

  if (body.status !== undefined) {
    if (
      typeof body.status !== "string" ||
      !(STATUSES as readonly string[]).includes(body.status)
    ) {
      return NextResponse.json({ error: "Unknown status." }, { status: 400 });
    }
    data.status = body.status;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  // Never allow the last Super Admin to be demoted or suspended.
  const removesSuperAdmin =
    target.role === "super_admin" &&
    ((data.role !== undefined && data.role !== "super_admin") ||
      (data.status !== undefined && data.status !== "active"));

  if (removesSuperAdmin) {
    const remaining = await prisma.profile.count({
      where: { role: "super_admin", status: "active", id: { not: id } },
    });
    if (remaining === 0) {
      return NextResponse.json(
        { error: "At least one active Super Admin must remain." },
        { status: 400 },
      );
    }
  }

  const updated = await prisma.profile.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ profile: updated });
}
