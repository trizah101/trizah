import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId");
  const where: any = {};
  if (transactionId) where.transactionId = transactionId;
  const logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  return NextResponse.json(logs);
}