// src/app/api/billing/completed-ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const fromDateStr = url.searchParams.get("fromDate");
  const toDateStr = url.searchParams.get("toDate");

  if (!fromDateStr || !toDateStr) {
    return NextResponse.json({ error: "Missing date range" }, { status: 400 });
  }

  const from = new Date(fromDateStr);
  const to = new Date(toDateStr);

  try {
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        AND: [
          { startTime: { gte: from } },
          { endTime: { lte: to } },
          // Ensure belongs to this agency via client or device (depending on your schema)
          // Assuming client has agencyId field:
          { client: { agencyId: session.id } },
        ],
      },
      include: {
        client: { select: { id: true, businessName: true } },
        device: { select: { id: true, name: true } },
        ad: { select: { id: true, title: true } },
      },
      orderBy: { startTime: "asc" },
    });

    const result = assignments.map((a) => {
      const hours =
        (a.endTime.getTime() - a.startTime.getTime()) / (1000 * 60 * 60);
      return {
        id: a.id,
        date: a.startTime.toISOString().slice(0, 10),
        client: { id: a.client.id, businessName: a.client.businessName },
        device: { id: a.device.id, name: a.device.name },
        ad: { id: a.ad.id, title: a.ad.title },
        startTime: a.startTime.getHours().toString().padStart(2, "0"),
        endTime: a.endTime.getHours().toString().padStart(2, "0"),
        hours: Math.round(hours * 100) / 100, // round to 2 decimals
      };
    });

    return NextResponse.json({ completed: result });
  } catch (error) {
    console.error("FETCH_COMPLETED_ADS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to fetch completed ads" },
      { status: 500 }
    );
  }
}
