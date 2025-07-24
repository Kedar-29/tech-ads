import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "AGENCY_CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  try {
    // Find assignments where startTime is in future (or now)
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        clientId: user.id,
        startTime: {
          gte: now,
        },
      },
      include: {
        ad: true,
        device: true,
      },
      orderBy: [{ startTime: "asc" }],
    });

    // Return as JSON (Date objects will be serialized as ISO strings)
    return NextResponse.json(assignments);
  } catch (error) {
    console.error("SCHEDULED_ADS_FETCH_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
