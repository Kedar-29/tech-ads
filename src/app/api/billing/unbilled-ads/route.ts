import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // ✅ Check session
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Get clientId
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "ClientId is required" }, { status: 400 });
  }

  // ✅ Current time in UTC (Prisma stores DateTime in UTC)
  const now = new Date();

  // ✅ Fetch only completed & unbilled assignments
  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: {
      clientId,
      billed: false,
      endTime: {
        lt: now, // strictly before "now"
      },
    },
    include: {
      ad: true,
      device: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  // ✅ Transform for frontend
  const data = assignments.map((a) => {
    const hours =
      (a.endTime.getTime() - a.startTime.getTime()) / (1000 * 60 * 60);

    return {
      id: a.id,
      ad: { title: a.ad.title },
      device: { name: a.device.name },
      hours: Math.max(0, Math.ceil(hours)), // always positive + round up
    };
  });

  return NextResponse.json({ assignments: data });
}
