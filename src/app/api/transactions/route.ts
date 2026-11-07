import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const currency = searchParams.get("currency");
  const account = searchParams.get("account");
  const direction = searchParams.get("direction");
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search");
  const where: any = {};
  if (type && type !== "All") where.type = type;
  if (currency && currency !== "All") where.currency = currency;
  if (account && account !== "All") where.account = account;
  if (direction && direction !== "All") where.direction = direction;
  if (from || to) {
    where.date = {};
    if (from) where.date.gte = new Date(from);
    if (to) where.date.lte = new Date(to);
  }
  if (search) {
    where.OR = [
      { referenceId: { contains: search } },
      { counterparty: { contains: search } },
      { notes: { contains: search } },
      { sku: { contains: search } },
      { asin: { contains: search } },
    ];
  }
  const txs = await prisma.transaction.findMany({ where, orderBy: { date: "desc" } });
  return NextResponse.json(txs);
}

export async function POST(req: Request) {
  const body = await req.json();
  const t = await prisma.transaction.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      referenceId: body.referenceId,
      type: body.type,
      account: body.account,
      direction: body.direction,
      currency: body.currency,
      amount: Number(body.amount ?? 0),
      exchangeRate: body.exchangeRate !== undefined && body.exchangeRate !== "" ? Number(body.exchangeRate) : null,
      convertedAmount: body.convertedAmount !== undefined && body.convertedAmount !== "" ? Number(body.convertedAmount) : null,
      convertedCurrency: body.convertedCurrency || null,
      audEquivalent: body.audEquivalent !== undefined && body.audEquivalent !== "" ? Number(body.audEquivalent) : null,
      counterparty: body.counterparty || null,
      sku: body.sku || null,
      asin: body.asin || null,
      notes: body.notes || null,
      isDemo: Boolean(body.isDemo ?? false),
      linkId: body.linkId || null,
    },
  });
  return NextResponse.json(t);
}

export async function PUT(req: Request) {
  const body = await req.json();
  const existing = await prisma.transaction.findUnique({ where: { id: body.id } });
  const t = await prisma.transaction.update({
    where: { id: body.id },
    data: {
      date: body.date ? new Date(body.date) : undefined,
      referenceId: body.referenceId,
      type: body.type,
      account: body.account,
      direction: body.direction,
      currency: body.currency,
      amount: body.amount !== undefined ? Number(body.amount) : undefined,
      exchangeRate: body.exchangeRate !== undefined ? (body.exchangeRate === "" ? null : Number(body.exchangeRate)) : undefined,
      convertedAmount: body.convertedAmount !== undefined ? (body.convertedAmount === "" ? null : Number(body.convertedAmount)) : undefined,
      convertedCurrency: body.convertedCurrency !== undefined ? (body.convertedCurrency || null) : undefined,
      audEquivalent: body.audEquivalent !== undefined ? (body.audEquivalent === "" ? null : Number(body.audEquivalent)) : undefined,
      counterparty: body.counterparty !== undefined ? (body.counterparty || null) : undefined,
      sku: body.sku !== undefined ? (body.sku || null) : undefined,
      asin: body.asin !== undefined ? (body.asin || null) : undefined,
      notes: body.notes !== undefined ? (body.notes || null) : undefined,
      isDemo: body.isDemo !== undefined ? Boolean(body.isDemo) : undefined,
      linkId: body.linkId !== undefined ? (body.linkId || null) : undefined,
    },
  });
  if (existing) {
    await prisma.auditLog.create({
      data: {
        transactionId: body.id,
        action: "UPDATE",
        before: JSON.stringify(existing),
        after: JSON.stringify(t),
      },
    });
  }
  return NextResponse.json(t);
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const linkId = searchParams.get("linkId");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const existing = await prisma.transaction.findUnique({ where: { id } });
  // if linked conversion, warn via response? We'll delete only this; client handles paired.
  await prisma.transaction.delete({ where: { id } });
  if (existing) {
    await prisma.auditLog.create({
      data: { transactionId: id, action: "DELETE", before: JSON.stringify(existing), after: null },
    });
  }
  return NextResponse.json({ ok: true, deletedId: id, linkId });
}