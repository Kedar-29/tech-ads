import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const sessionUser = await getSessionUser(req);

  if (!sessionUser || sessionUser.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    const liveAds = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        startTime: { lte: now },
        endTime: { gt: now },
        device: {
          agencyId: sessionUser.id,
        },
      },
      include: {
        ad: true, // ad.fileUrl included here
        client: {
          select: {
            businessName: true,
          },
        },
        device: {
          select: {
            name: true,
            uuid: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json(liveAds);
  } catch (error) {
    console.error("Error fetching live ads:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
