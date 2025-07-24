// app/api/assignments/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, deviceId, adId, date, startTime, endTime } = await req.json();

  if (![clientId, deviceId, adId, date, startTime, endTime].every(Boolean)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const agencyId = session.id;

  // Validate ownership of resources
  const [clientOk, deviceOk, adOk] = await Promise.all([
    prisma.agencyClient.count({ where: { id: clientId, agencyId } }),
    prisma.device.count({ where: { id: deviceId, agencyId } }),
    prisma.ad.count({ where: { id: adId, agencyId } }),
  ]);

  if (!clientOk || !deviceOk || !adOk) {
    return NextResponse.json({ error: "Unauthorized resources" }, { status: 403 });
  }

  const startDt = new Date(startTime);
  const endDt = new Date(endTime);

  if (startDt >= endDt) {
    return NextResponse.json({ error: "Invalid time range" }, { status: 400 });
  }

  // Overlap check
  const overlaps = await prisma.clientDeviceAdAssignment.findMany({
    where: {
      deviceId,
      OR: [
        {
          AND: [
            { startTime: { lt: endDt } },
            { endTime: { gt: startDt } },
          ],
        },
      ],
    },
  });

  if (overlaps.length > 0) {
    return NextResponse.json({ error: "Slot already booked" }, { status: 409 });
  }

  // Create assignment
  await prisma.clientDeviceAdAssignment.create({
    data: {
      clientId,
      deviceId,
      adId,
      startTime: startDt,
      endTime: endDt,
    },
  });

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const session = await getSessionUser(req);

  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const dateStr = searchParams.get("date");

  // If deviceId and date provided, return filtered assignments for that device and day
  if (deviceId && dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 });
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        deviceId,
        startTime: { lte: dayEnd },
        endTime: { gte: dayStart },
      },
      include: {
        client: true,
        device: true,
        ad: true,
      },
      orderBy: {
        startTime: "desc",
      },
    });

    return NextResponse.json({ assignments });
  }

  // Otherwise return all assignments for this agency (across all devices/clients/ads)
  const agencyId = session.id;

  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: {
      device: { agencyId },
      client: { agencyId },
      ad: { agencyId },
    },
    include: {
      client: true,
      device: true,
      ad: true,
    },
    orderBy: {
      startTime: "desc",
    },
  });

  return NextResponse.json({ assignments });
}
