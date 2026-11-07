import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const wallets = await prisma.wallet.findMany({ orderBy: { createdAt: "asc" } });
  return NextResponse.json(wallets);
}

export async function POST(req: Request) {
  const body = await req.json();
  const w = await prisma.wallet.create({
    data: {
      name: body.name,
      currency: body.currency,
      openingBalance: Number(body.openingBalance ?? 0),
      isDefault: Boolean(body.isDefault ?? false),
    },
  });
  return NextResponse.json(w);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const w = await prisma.wallet.update({
    where: { id: body.id },
    data: {
      name: body.name,
      currency: body.currency,
      openingBalance: Number(body.openingBalance ?? 0),
      isDefault: Boolean(body.isDefault ?? false),
    },
  });
  return NextResponse.json(w);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.wallet.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}