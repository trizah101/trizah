import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardPermission } from "@/lib/api-auth";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
const dt = (v: any) => (v ? new Date(v) : null);

export async function GET() { return NextResponse.json(await prisma.shipping.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const denied = await guardPermission("finance:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.shipping.create({ data: {
    agent: b.agent || null, shipmentRef: b.shipmentRef || null, invoiceDate: dt(b.invoiceDate),
    audCharge: num(b.audCharge), audToRmbRate: num(b.audToRmbRate), expectedRmb: num(b.expectedRmb),
    actualRmbPaid: num(b.actualRmbPaid), actualAudDebited: num(b.actualAudDebited), status: b.status || "Pending",
    notes: b.notes || null, isDemo: Boolean(b.isDemo ?? false),
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const denied = await guardPermission("finance:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.shipping.update({ where: { id: b.id }, data: {
    agent: b.agent !== undefined ? (b.agent || null) : undefined,
    shipmentRef: b.shipmentRef !== undefined ? (b.shipmentRef || null) : undefined,
    invoiceDate: b.invoiceDate !== undefined ? dt(b.invoiceDate) : undefined,
    audCharge: b.audCharge !== undefined ? num(b.audCharge) : undefined,
    audToRmbRate: b.audToRmbRate !== undefined ? num(b.audToRmbRate) : undefined,
    expectedRmb: b.expectedRmb !== undefined ? num(b.expectedRmb) : undefined,
    actualRmbPaid: b.actualRmbPaid !== undefined ? num(b.actualRmbPaid) : undefined,
    actualAudDebited: b.actualAudDebited !== undefined ? num(b.actualAudDebited) : undefined,
    status: b.status !== undefined ? (b.status || null) : undefined,
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
  await prisma.shipping.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}