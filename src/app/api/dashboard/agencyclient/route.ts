// app/api/dashboard/agencyclient/route.ts

import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = user.id;
    const today = new Date();

    const upcomingAds = await prisma.clientDeviceAdAssignment.count({
      where: {
        clientId,
        date: {
          gte: today,
        },
      },
    });

    const adsPlayed = await prisma.clientDeviceAdAssignment.count({
      where: {
        clientId,
        date: {
          lt: today,
        },
      },
    });

    const bills = await prisma.bill.count({
      where: { clientId },
    });

    return NextResponse.json({ upcomingAds, adsPlayed, bills });
  } catch (error) {
    console.error("Dashboard route error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
