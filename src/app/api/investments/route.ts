import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
const dt = (v: any) => (v ? new Date(v) : null);

export async function GET() { return NextResponse.json(await prisma.investment.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  const r = await prisma.investment.create({ data: {
    founder: b.founder || null, date: dt(b.date), currency: b.currency || null, amount: num(b.amount),
    rate: num(b.rate), audEquivalent: num(b.audEquivalent), reference: b.reference || null,
    type: b.type || null, notes: b.notes || null, isDemo: Boolean(b.isDemo ?? false),
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const b = await req.json();
  const r = await prisma.investment.update({ where: { id: b.id }, data: {
    founder: b.founder !== undefined ? (b.founder || null) : undefined,
    date: b.date !== undefined ? dt(b.date) : undefined,
    currency: b.currency !== undefined ? (b.currency || null) : undefined,
    amount: b.amount !== undefined ? num(b.amount) : undefined,
    rate: b.rate !== undefined ? num(b.rate) : undefined,
    audEquivalent: b.audEquivalent !== undefined ? num(b.audEquivalent) : undefined,
    reference: b.reference !== undefined ? (b.reference || null) : undefined,
    type: b.type !== undefined ? (b.type || null) : undefined,
    notes: b.notes !== undefined ? (b.notes || null) : undefined,
    isDemo: b.isDemo !== undefined ? Boolean(b.isDemo) : undefined,
  }});
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}