// src/app/api/ads/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "AGENCY") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ads = await prisma.ad.findMany({
      where: { agencyId: session.id },
      include: {
        devices: {
          select: { id: true },
        },
      },
      orderBy: { title: "asc" },
    });

    const transformedAds = ads.map((ad) => ({
      id: ad.id,
      title: ad.title,
      fileUrl: ad.fileUrl,
      assignedToDeviceIds: ad.devices.map((device) => device.id),
    }));

    return NextResponse.json(transformedAds);
  } catch (error) {
    console.error("ADS_FETCH_ERROR:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
