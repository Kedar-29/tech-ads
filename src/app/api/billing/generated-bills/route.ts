import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const session = await getSessionUser(req);

  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");
    const fromDateStr = url.searchParams.get("fromDate");
    const toDateStr = url.searchParams.get("toDate");

    // Use Prisma.BillWhereInput for correct typing
    const filters: Prisma.BillWhereInput = {
      agencyId: session.id,
    };

    if (clientId) {
      filters.clientId = clientId;
    }

    if (fromDateStr && toDateStr) {
      filters.AND = [
        { fromDate: { gte: new Date(fromDateStr) } },
        { toDate: { lte: new Date(toDateStr) } },
      ];
    }

    const bills = await prisma.bill.findMany({
      where: filters,
      include: {
        client: {
          select: {
            businessName: true,
            whatsappNumber: true,
            area: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
          },
        },
        items: {
          include: {
            ad: true,
            device: true,
          },
        },
      },
      orderBy: {
        fromDate: "desc",
      },
    });

    return NextResponse.json({ bills });
  } catch (error) {
    console.error("FETCH_BILLS_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch bills" }, { status: 500 });
  }
}
