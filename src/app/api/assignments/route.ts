// /app/api/ads/assign/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { clientId, deviceId, adId, dates, startTime, endTime } = await req.json();

    if (!clientId || !deviceId || !adId || !dates?.length || !startTime || !endTime) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const [sh, sm, ss = 0] = startTime.split(":").map(Number);
    const [eh, em, es = 0] = endTime.split(":").map(Number);

    const assignments = [];

    for (const dateStr of dates) {
      const [year, month, day] = dateStr.split("-").map(Number);
      const startDt = new Date(year, month - 1, day, sh, sm, ss);
      const endDt = new Date(year, month - 1, day, eh, em, es);

      // Check overlapping assignments
      const overlap = await prisma.clientDeviceAdAssignment.findFirst({
        where: {
          deviceId,
          AND: [
            { startTime: { lt: endDt } },
            { endTime: { gt: startDt } },
          ],
        },
      });

      if (overlap) {
        return NextResponse.json({
          error: `Slot already booked for ${dateStr}`,
          status: 409,
        });
      }

      const assignment = await prisma.clientDeviceAdAssignment.create({
        data: { clientId, deviceId, adId, startTime: startDt, endTime: endDt },
      });
      assignments.push(assignment);
    }

    return NextResponse.json({ success: true, assignments });
  } catch (err) {
    console.error("Error creating ad assignments:", err);
    return NextResponse.json({ error: "Failed to assign ad" }, { status: 500 });
  }
}

// /app/api/ads/device/[deviceId]/route.ts
export async function GET() {
  try {
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      include: { client: true, device: true, ad: true },
      orderBy: { startTime: "asc" },
    });
    return NextResponse.json({ assignments });
  } catch (err) {
    console.error("Error fetching assignments:", err);
    return NextResponse.json({ error: "Failed to fetch assignments" }, { status: 500 });
  }
}

// PATCH / DELETE routes
export async function PATCH(req: Request) {
  try {
    const { id, startTime, endTime, adId } = await req.json();
    const assignment = await prisma.clientDeviceAdAssignment.update({
      where: { id },
      data: { startTime, endTime, adId },
      include: { client: true, device: true, ad: true },
    });
    return NextResponse.json({ assignment });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    await prisma.clientDeviceAdAssignment.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}