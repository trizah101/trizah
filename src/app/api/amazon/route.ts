import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardPermission } from "@/lib/api-auth";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
const dt = (v: any) => (v ? new Date(v) : null);

export async function GET() { return NextResponse.json(await prisma.amazonPayout.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const denied = await guardPermission("finance:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.amazonPayout.create({ data: {
    settlementId: b.settlementId || null, period: b.period || null,
    grossSales: num(b.grossSales), referralFees: num(b.referralFees), fbaFees: num(b.fbaFees),
    advertising: num(b.advertising), refunds: num(b.refunds), otherAdjustments: num(b.otherAdjustments),
    netPayout: num(b.netPayout), actualAudReceived: num(b.actualAudReceived), account: b.account || null,
    settlementDate: dt(b.settlementDate), notes: b.notes || null, isDemo: Boolean(b.isDemo ?? false),
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const denied = await guardPermission("finance:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.amazonPayout.update({ where: { id: b.id }, data: {
    settlementId: b.settlementId !== undefined ? (b.settlementId || null) : undefined,
    period: b.period !== undefined ? (b.period || null) : undefined,
    grossSales: b.grossSales !== undefined ? num(b.grossSales) : undefined,
    referralFees: b.referralFees !== undefined ? num(b.referralFees) : undefined,
    fbaFees: b.fbaFees !== undefined ? num(b.fbaFees) : undefined,
    advertising: b.advertising !== undefined ? num(b.advertising) : undefined,
    refunds: b.refunds !== undefined ? num(b.refunds) : undefined,
    otherAdjustments: b.otherAdjustments !== undefined ? num(b.otherAdjustments) : undefined,
    netPayout: b.netPayout !== undefined ? num(b.netPayout) : undefined,
    actualAudReceived: b.actualAudReceived !== undefined ? num(b.actualAudReceived) : undefined,
    account: b.account !== undefined ? (b.account || null) : undefined,
    settlementDate: b.settlementDate !== undefined ? dt(b.settlementDate) : undefined,
    notes: b.notes !== undefined ? (b.notes || null) : undefined,
    isDemo: b.isDemo !== undefined ? Boolean(b.isDemo) : undefined,
  }});
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const denied = await guardPermission("finance:write");
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.amazonPayout.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}