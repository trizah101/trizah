import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const rows = await prisma.supplierPayment.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(rows);
}
export async function POST(req: Request) {
  const b = await req.json();
  const r = await prisma.supplierPayment.create({
    data: {
      supplier: b.supplier,
      invoiceNumber: b.invoiceNumber || null,
      orderDate: b.orderDate ? new Date(b.orderDate) : null,
      productName: b.productName || null,
      sku: b.sku || null,
      asin: b.asin || null,
      unitsOrdered: b.unitsOrdered !== undefined && b.unitsOrdered !== "" ? Number(b.unitsOrdered) : null,
      usdPrice: b.usdPrice !== undefined && b.usdPrice !== "" ? Number(b.usdPrice) : null,
      usdToRmbRate: b.usdToRmbRate !== undefined && b.usdToRmbRate !== "" ? Number(b.usdToRmbRate) : null,
      totalRmbPayable: b.totalRmbPayable !== undefined && b.totalRmbPayable !== "" ? Number(b.totalRmbPayable) : null,
      actualRmbPaid: b.actualRmbPaid !== undefined && b.actualRmbPaid !== "" ? Number(b.actualRmbPaid) : null,
      paymentStatus: b.paymentStatus || "Unpaid",
      paymentDate: b.paymentDate ? new Date(b.paymentDate) : null,
      audEquivalent: b.audEquivalent !== undefined && b.audEquivalent !== "" ? Number(b.audEquivalent) : null,
      notes: b.notes || null,
      isDemo: Boolean(b.isDemo ?? false),
    },
  });
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const b = await req.json();
  const r = await prisma.supplierPayment.update({
    where: { id: b.id },
    data: {
      supplier: b.supplier,
      invoiceNumber: b.invoiceNumber !== undefined ? (b.invoiceNumber || null) : undefined,
      orderDate: b.orderDate !== undefined ? (b.orderDate ? new Date(b.orderDate) : null) : undefined,
      productName: b.productName !== undefined ? (b.productName || null) : undefined,
      sku: b.sku !== undefined ? (b.sku || null) : undefined,
      asin: b.asin !== undefined ? (b.asin || null) : undefined,
      unitsOrdered: b.unitsOrdered !== undefined ? (b.unitsOrdered === "" ? null : Number(b.unitsOrdered)) : undefined,
      usdPrice: b.usdPrice !== undefined ? (b.usdPrice === "" ? null : Number(b.usdPrice)) : undefined,
      usdToRmbRate: b.usdToRmbRate !== undefined ? (b.usdToRmbRate === "" ? null : Number(b.usdToRmbRate)) : undefined,
      totalRmbPayable: b.totalRmbPayable !== undefined ? (b.totalRmbPayable === "" ? null : Number(b.totalRmbPayable)) : undefined,
      actualRmbPaid: b.actualRmbPaid !== undefined ? (b.actualRmbPaid === "" ? null : Number(b.actualRmbPaid)) : undefined,
      paymentStatus: b.paymentStatus !== undefined ? (b.paymentStatus || null) : undefined,
      paymentDate: b.paymentDate !== undefined ? (b.paymentDate ? new Date(b.paymentDate) : null) : undefined,
      audEquivalent: b.audEquivalent !== undefined ? (b.audEquivalent === "" ? null : Number(b.audEquivalent)) : undefined,
      notes: b.notes !== undefined ? (b.notes || null) : undefined,
      isDemo: b.isDemo !== undefined ? Boolean(b.isDemo) : undefined,
    },
  });
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.supplierPayment.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}