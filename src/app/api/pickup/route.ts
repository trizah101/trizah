import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
const dt = (v: any) => (v ? new Date(v) : null);

export async function GET() { return NextResponse.json(await prisma.pickup.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  const r = await prisma.pickup.create({ data: {
    reference: b.reference || null, supplier: b.supplier || null, location: b.location || null,
    shipmentId: b.shipmentId || null, rmbCharge: num(b.rmbCharge), audEquivalent: num(b.audEquivalent),
    sku: b.sku || null, notes: b.notes || null, isDemo: Boolean(b.isDemo ?? false),
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const b = await req.json();
  const r = await prisma.pickup.update({ where: { id: b.id }, data: {
    reference: b.reference !== undefined ? (b.reference || null) : undefined,
    supplier: b.supplier !== undefined ? (b.supplier || null) : undefined,
    location: b.location !== undefined ? (b.location || null) : undefined,
    shipmentId: b.shipmentId !== undefined ? (b.shipmentId || null) : undefined,
    rmbCharge: b.rmbCharge !== undefined ? num(b.rmbCharge) : undefined,
    audEquivalent: b.audEquivalent !== undefined ? num(b.audEquivalent) : undefined,
    sku: b.sku !== undefined ? (b.sku || null) : undefined,
    notes: b.notes !== undefined ? (b.notes || null) : undefined,
    isDemo: b.isDemo !== undefined ? Boolean(b.isDemo) : undefined,
  }});
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.pickup.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}