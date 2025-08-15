import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return NextResponse.json({ error: "ClientId is required" }, { status: 400 });
  }

  // Only fetch unbilled assignments
  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: { clientId, billed: false },
    include: { ad: true, device: true },
    orderBy: { createdAt: "asc" },
  });

  const data = assignments.map((a) => {
    const hours = Math.max(
      0,
      (a.endTime.getTime() - a.startTime.getTime()) / (1000 * 60 * 60)
    );
    return {
      id: a.id,
      ad: { title: a.ad.title },
      device: { name: a.device.name },
      hours: Math.ceil(hours),
    };
  });

  return NextResponse.json({ assignments: data });
}
