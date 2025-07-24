import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Fetch all assignments where current time is within startTime and endTime
    const liveAssignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        startTime: {
          lte: now,
        },
        endTime: {
          gt: now,
        },
      },
      include: {
        ad: true,
        device: true,
      },
    });

    // Debug logs (optional)
    console.log("NOW:", now.toISOString());
    console.log("Live Assignments:", liveAssignments.map(a => ({
      id: a.id,
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
    })));

    // Format response with ISO string dates
    const response = liveAssignments.map((a) => ({
      id: a.id,
      clientId: a.clientId,
      deviceId: a.deviceId,
      adId: a.adId,
      date: a.date.toISOString(),
      startTime: a.startTime.toISOString(),
      endTime: a.endTime.toISOString(),
      createdAt: a.createdAt.toISOString(),
      ad: {
        id: a.ad.id,
        title: a.ad.title,
        fileUrl: a.ad.fileUrl,
      },
      device: {
        id: a.device.id,
        name: a.device.name,
        uuid: a.device.uuid,
        size: a.device.size,
        model: a.device.model,
        latitude: a.device.latitude,
        longitude: a.device.longitude,
        apiEndpoint: a.device.apiEndpoint,
        publicKey: a.device.publicKey,
        secretKey: a.device.secretKey,
        status: a.device.status,
      },
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("LIVE_ADS_FETCH_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
