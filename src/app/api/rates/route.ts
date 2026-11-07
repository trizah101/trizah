import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));
const dt = (v: any) => (v ? new Date(v) : null);

export async function GET() { return NextResponse.json(await prisma.exchangeRate.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const b = await req.json();
  const r = await prisma.exchangeRate.create({ data: {
    pair: b.pair, rate: Number(b.rate), effectiveDate: dt(b.effectiveDate), source: b.source || null,
    reference: b.reference || null,
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const b = await req.json();
  const r = await prisma.exchangeRate.update({ where: { id: b.id }, data: {
    pair: b.pair !== undefined ? b.pair : undefined,
    rate: b.rate !== undefined ? Number(b.rate) : undefined,
    effectiveDate: b.effectiveDate !== undefined ? dt(b.effectiveDate) : undefined,
    source: b.source !== undefined ? (b.source || null) : undefined,
    reference: b.reference !== undefined ? (b.reference || null) : undefined,
  }});
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.exchangeRate.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}