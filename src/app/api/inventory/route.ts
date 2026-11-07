import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { guardPermission } from "@/lib/api-auth";

const num = (v: any) => (v === "" || v === undefined || v === null ? null : Number(v));

export async function GET() { return NextResponse.json(await prisma.inventoryItem.findMany({ orderBy: { createdAt: "desc" } })); }
export async function POST(req: Request) {
  const denied = await guardPermission("operations:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.inventoryItem.create({ data: {
    sku: b.sku, asin: b.asin || null, productName: b.productName || null, shipmentId: b.shipmentId || null,
    units: num(b.units), supplierCostRmb: num(b.supplierCostRmb), shippingCostRmb: num(b.shippingCostRmb),
    pickupCostRmb: num(b.pickupCostRmb), otherCostRmb: num(b.otherCostRmb), totalRmbLanded: num(b.totalRmbLanded),
    audCostPerRmb: num(b.audCostPerRmb), totalAudLanded: num(b.totalAudLanded), audCostPerUnit: num(b.audCostPerUnit),
    rmbCostPerUnit: num(b.rmbCostPerUnit), allocationMethod: b.allocationMethod || null,
    isDemo: Boolean(b.isDemo ?? false),
  }});
  return NextResponse.json(r);
}
export async function PUT(req: Request) {
  const denied = await guardPermission("operations:write");
  if (denied) return denied;
  const b = await req.json();
  const r = await prisma.inventoryItem.update({ where: { id: b.id }, data: {
    sku: b.sku !== undefined ? b.sku : undefined,
    asin: b.asin !== undefined ? (b.asin || null) : undefined,
    productName: b.productName !== undefined ? (b.productName || null) : undefined,
    shipmentId: b.shipmentId !== undefined ? (b.shipmentId || null) : undefined,
    units: b.units !== undefined ? num(b.units) : undefined,
    supplierCostRmb: b.supplierCostRmb !== undefined ? num(b.supplierCostRmb) : undefined,
    shippingCostRmb: b.shippingCostRmb !== undefined ? num(b.shippingCostRmb) : undefined,
    pickupCostRmb: b.pickupCostRmb !== undefined ? num(b.pickupCostRmb) : undefined,
    otherCostRmb: b.otherCostRmb !== undefined ? num(b.otherCostRmb) : undefined,
    totalRmbLanded: b.totalRmbLanded !== undefined ? num(b.totalRmbLanded) : undefined,
    audCostPerRmb: b.audCostPerRmb !== undefined ? num(b.audCostPerRmb) : undefined,
    totalAudLanded: b.totalAudLanded !== undefined ? num(b.totalAudLanded) : undefined,
    audCostPerUnit: b.audCostPerUnit !== undefined ? num(b.audCostPerUnit) : undefined,
    rmbCostPerUnit: b.rmbCostPerUnit !== undefined ? num(b.rmbCostPerUnit) : undefined,
    allocationMethod: b.allocationMethod !== undefined ? (b.allocationMethod || null) : undefined,
    isDemo: b.isDemo !== undefined ? Boolean(b.isDemo) : undefined,
  }});
  return NextResponse.json(r);
}
export async function DELETE(req: Request) {
  const denied = await guardPermission("operations:write");
  if (denied) return denied;
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.inventoryItem.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}