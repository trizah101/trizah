import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  // default wallets
  const existingWallets = await prisma.wallet.count();
  if (existingWallets === 0) {
    await prisma.wallet.createMany({ data: [
      { name: "Wise Account", currency: "AUD", openingBalance: 0, isDefault: true },
      { name: "Australian Bank", currency: "AUD", openingBalance: 0, isDefault: true },
      { name: "Bangladesh Wallet", currency: "BDT", openingBalance: 0, isDefault: true },
      { name: "China RMB Wallet", currency: "RMB", openingBalance: 0, isDefault: true },
      { name: "Other Wallet", currency: "USD", openingBalance: 0, isDefault: true },
    ] });
  }

  // demo rates
  const rates = [
    { pair: "BDT->RMB", rate: 0.064, source: "Demo" },
    { pair: "AUD->RMB", rate: 4.76, source: "Demo" },
    { pair: "USD->RMB", rate: 6.69, source: "Demo" },
  ];
  for (const r of rates) {
    await prisma.exchangeRate.create({ data: { pair: r.pair, rate: r.rate, source: r.source, reference: "DEMO" } });
  }

  // demo transactions
  const ref1 = "DEMO-CONV-001";
  await prisma.transaction.createMany({ data: [
    { date: new Date(), referenceId: ref1, type: "Conversion", account: "Bangladesh Wallet", direction: "OUT", currency: "BDT", amount: 50000, exchangeRate: 0.064, convertedAmount: 3200, convertedCurrency: "RMB", audEquivalent: 0, notes: "DEMO: BDT to RMB conversion", isDemo: true, linkId: ref1 },
    { date: new Date(), referenceId: ref1, type: "Conversion", account: "China RMB Wallet", direction: "IN", currency: "RMB", amount: 3200, exchangeRate: 0.064, convertedAmount: 50000, convertedCurrency: "BDT", audEquivalent: 0, notes: "DEMO: BDT to RMB conversion", isDemo: true, linkId: ref1 },
  ] });

  const ref2 = "DEMO-CONV-002";
  await prisma.transaction.createMany({ data: [
    { date: new Date(), referenceId: ref2, type: "Conversion", account: "Wise Account", direction: "OUT", currency: "AUD", amount: 1000, exchangeRate: 4.76, convertedAmount: 4760, convertedCurrency: "RMB", audEquivalent: 1000, notes: "DEMO: AUD to RMB conversion", isDemo: true, linkId: ref2 },
    { date: new Date(), referenceId: ref2, type: "Conversion", account: "China RMB Wallet", direction: "IN", currency: "RMB", amount: 4760, exchangeRate: 4.76, convertedAmount: 1000, convertedCurrency: "AUD", audEquivalent: 1000, notes: "DEMO: AUD to RMB conversion", isDemo: true, linkId: ref2 },
  ] });

  // supplier invoice demo
  await prisma.supplierPayment.create({ data: {
    supplier: "Demo Supplier", invoiceNumber: "DEMO-INV-001", orderDate: new Date(),
    productName: "Demo Product", sku: "DEMO-SKU", asin: "B0DEMO",
    unitsOrdered: 100, usdPrice: 1000, usdToRmbRate: 6.69, totalRmbPayable: 6690,
    actualRmbPaid: 0, paymentStatus: "Unpaid", notes: "DEMO", isDemo: true,
  } });

  // pickup demo
  await prisma.pickup.create({ data: {
    reference: "DEMO-PICKUP-001", supplier: "Demo Supplier", location: "Shenzhen",
    rmbCharge: 200, audEquivalent: 0, sku: "DEMO-SKU", notes: "DEMO", isDemo: true,
  } });

  // shipping demo
  await prisma.shipping.create({ data: {
    agent: "Demo Agent", shipmentRef: "DEMO-SHIP-001", invoiceDate: new Date(),
    audCharge: 500, audToRmbRate: 4.76, expectedRmb: 2380, actualRmbPaid: 0,
    status: "Pending", notes: "DEMO", isDemo: true,
  } });

  // amazon payout demo
  await prisma.amazonPayout.create({ data: {
    settlementId: "DEMO-SETTLE-001", period: "Demo Period", grossSales: 5000,
    referralFees: 500, fbaFees: 300, advertising: 200, refunds: 50, otherAdjustments: 0,
    netPayout: 3950, actualAudReceived: 3950, account: "Wise Account", settlementDate: new Date(),
    notes: "DEMO", isDemo: true,
  } });

  // inventory demo
  await prisma.inventoryItem.create({ data: {
    sku: "DEMO-SKU", asin: "B0DEMO", productName: "Demo Product", shipmentId: "DEMO-SHIP-001",
    units: 100, supplierCostRmb: 6690, shippingCostRmb: 2380, pickupCostRmb: 200, otherCostRmb: 0,
    totalRmbLanded: 9270, audCostPerRmb: 0.2101, totalAudLanded: 1947.6, audCostPerUnit: 19.476,
    rmbCostPerUnit: 92.7, allocationMethod: "Units", isDemo: true,
  } });

  // investment demo
  await prisma.investment.create({ data: {
    founder: "Demo Founder", date: new Date(), currency: "BDT", amount: 50000, rate: 0.064,
    audEquivalent: 0, reference: "DEMO-INV", type: "Capital", notes: "DEMO", isDemo: true,
  } });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  await prisma.transaction.deleteMany({ where: { isDemo: true } });
  await prisma.supplierPayment.deleteMany({ where: { isDemo: true } });
  await prisma.shipping.deleteMany({ where: { isDemo: true } });
  await prisma.pickup.deleteMany({ where: { isDemo: true } });
  await prisma.inventoryItem.deleteMany({ where: { isDemo: true } });
  await prisma.amazonPayout.deleteMany({ where: { isDemo: true } });
  await prisma.investment.deleteMany({ where: { isDemo: true } });
  await prisma.exchangeRate.deleteMany({ where: { reference: "DEMO" } });
  return NextResponse.json({ ok: true });
}