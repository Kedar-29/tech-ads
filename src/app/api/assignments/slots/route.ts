import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get("deviceId");
  const dateStr = searchParams.get("date");

  if (!deviceId || !dateStr) {
    return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
  }

  const selectedDate = new Date(dateStr);
  if (isNaN(selectedDate.getTime())) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: {
      deviceId,
      startTime: {
        gte: startOfDay,
      },
      endTime: {
        lte: endOfDay,
      },
    },
  });

  const halfHourSlots = Array(48).fill("AVAILABLE");

  assignments.forEach(({ startTime, endTime }) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const startSlot = Math.floor((start.getHours() * 60 + start.getMinutes()) / 30);
    const endSlot = Math.ceil((end.getHours() * 60 + end.getMinutes()) / 30);
    for (let i = startSlot; i < endSlot; i++) {
      if (i >= 0 && i < 48) {
        halfHourSlots[i] = "BOOKED";
      }
    }
  });

  // 👇 convert half-hour slots into hourly boolean slots
  const hourlyBooked = Array(24).fill(false);
  for (let i = 0; i < 24; i++) {
    const slot1 = halfHourSlots[i * 2];
    const slot2 = halfHourSlots[i * 2 + 1];
    hourlyBooked[i] = slot1 === "BOOKED" || slot2 === "BOOKED";
  }

  return NextResponse.json({ bookedSlots: hourlyBooked });
}
