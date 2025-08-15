import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, deviceId, adId, dates, startTime, endTime } = await req.json();

  if (![clientId, deviceId, adId, dates?.length, startTime, endTime].every(Boolean)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const agencyId = session.id;

  // Validate ownership
  const [clientOk, deviceOk, adOk] = await Promise.all([
    prisma.agencyClient.count({ where: { id: clientId, agencyId } }),
    prisma.device.count({ where: { id: deviceId, agencyId } }),
    prisma.ad.count({ where: { id: adId, agencyId } }),
  ]);

  if (!clientOk || !deviceOk || !adOk) {
    return NextResponse.json({ error: "Unauthorized resources" }, { status: 403 });
  }

  for (const dateStr of dates) {
    const startDt = new Date(`${dateStr}T${startTime}`);
    const endDt = new Date(`${dateStr}T${endTime}`);

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
      return NextResponse.json({
        error: `Slot already booked for ${dateStr}`,
        status: 409,
      });
    }

    await prisma.clientDeviceAdAssignment.create({
      data: { clientId, deviceId, adId, startTime: startDt, endTime: endDt },
    });
  }

  return NextResponse.json({ success: true });
}


//export async function GET(req: NextRequest) {
export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const agencyId = session.id;

  try {
    // Fetch all assignments belonging to this agency's devices/clients
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        OR: [
          { client: { agencyId } },
          { device: { agencyId } },
          { ad: { agencyId } },
        ],
      },
      include: {
        client: true,
        device: true,
        ad: true,
      },
      orderBy: { startTime: "asc" },
    });

    return NextResponse.json({ assignments });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}