import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const data = {
    wallets: await prisma.wallet.findMany(),
    transactions: await prisma.transaction.findMany(),
    suppliers: await prisma.supplierPayment.findMany(),
    shipping: await prisma.shipping.findMany(),
    pickup: await prisma.pickup.findMany(),
    inventory: await prisma.inventoryItem.findMany(),
    amazon: await prisma.amazonPayout.findMany(),
    investments: await prisma.investment.findMany(),
    rates: await prisma.exchangeRate.findMany(),
    audit: await prisma.auditLog.findMany(),
  };
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  // wipe
  await prisma.auditLog.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.supplierPayment.deleteMany();
  await prisma.shipping.deleteMany();
  await prisma.pickup.deleteMany();
  await prisma.inventoryItem.deleteMany();
  await prisma.amazonPayout.deleteMany();
  await prisma.investment.deleteMany();
  await prisma.exchangeRate.deleteMany();

  if (body.wallets) await prisma.wallet.createMany({ data: body.wallets.map((x: any) => ({ ...x, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.transactions) await prisma.transaction.createMany({ data: body.transactions.map((x: any) => ({ ...x, date: x.date ? new Date(x.date) : new Date(), createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.suppliers) await prisma.supplierPayment.createMany({ data: body.suppliers.map((x: any) => ({ ...x, orderDate: x.orderDate ? new Date(x.orderDate) : null, paymentDate: x.paymentDate ? new Date(x.paymentDate) : null, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.shipping) await prisma.shipping.createMany({ data: body.shipping.map((x: any) => ({ ...x, invoiceDate: x.invoiceDate ? new Date(x.invoiceDate) : null, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.pickup) await prisma.pickup.createMany({ data: body.pickup.map((x: any) => ({ ...x, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.inventory) await prisma.inventoryItem.createMany({ data: body.inventory.map((x: any) => ({ ...x, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.amazon) await prisma.amazonPayout.createMany({ data: body.amazon.map((x: any) => ({ ...x, settlementDate: x.settlementDate ? new Date(x.settlementDate) : null, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.investments) await prisma.investment.createMany({ data: body.investments.map((x: any) => ({ ...x, date: x.date ? new Date(x.date) : null, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  if (body.rates) await prisma.exchangeRate.createMany({ data: body.rates.map((x: any) => ({ ...x, effectiveDate: x.effectiveDate ? new Date(x.effectiveDate) : null, createdAt: x.createdAt ? new Date(x.createdAt) : undefined, updatedAt: x.updatedAt ? new Date(x.updatedAt) : undefined }) ) });
  return NextResponse.json({ ok: true });
}