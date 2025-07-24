import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY_CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const billId = url.pathname.split("/").pop();

  if (!billId) {
    return NextResponse.json({ error: "Bill ID is required" }, { status: 400 });
  }

  // Find bill owned by session user
  const bill = await prisma.bill.findFirst({
    where: {
      id: billId,
      clientId: session.id,
    },
    include: {
      agency: true,
      client: true,
      items: {
        include: {
          ad: true,
          device: true,
        },
      },
    },
  });

  if (!bill) {
    return NextResponse.json({ error: "Bill not found or unauthorized" }, { status: 404 });
  }

  // Format dates to ISO strings
  const formattedBill = {
    ...bill,
    createdAt: bill.createdAt.toISOString(),
    fromDate: bill.fromDate.toISOString(),
    toDate: bill.toDate.toISOString(),
  };

  return NextResponse.json(formattedBill);
}
