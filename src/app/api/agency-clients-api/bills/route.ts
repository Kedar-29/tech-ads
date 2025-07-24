// app/api/agency-clients-api/bills/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface BillResponse {
  id: string;
  invoiceNumber: string;
  totalPrice: number;
  status: "PENDING" | "PAID" | "DELAYED";
  createdAt: string;
  fromDate: string;
  toDate: string;
}

export async function GET(req: NextRequest): Promise<NextResponse<BillResponse[] | { error: string }>> {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bills = await prisma.bill.findMany({
      where: {
        clientId: session.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted: BillResponse[] = bills.map((bill) => ({
      id: bill.id,
      invoiceNumber: bill.invoiceNumber,
      totalPrice: bill.totalPrice,
      status: bill.status,
      createdAt: bill.createdAt.toISOString(),
      fromDate: bill.fromDate.toISOString(),
      toDate: bill.toDate.toISOString(),
    }));

    return NextResponse.json(formatted);
  } catch (error) {
    console.error("[CLIENT BILLS API ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
