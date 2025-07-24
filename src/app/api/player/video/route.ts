// src/app/api/player/video/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { key } = await req.json();

    if (!key || typeof key !== "string") {
      return NextResponse.json({ error: "Missing or invalid key" }, { status: 400 });
    }

    // Find device with matching public key or secret key
    const device = await prisma.device.findFirst({
      where: {
        OR: [{ publicKey: key }, { secretKey: key }],
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Invalid device key" }, { status: 404 });
    }

    const now = new Date();

    // Get current live assignment for this device
    const currentAssignment = await prisma.clientDeviceAdAssignment.findFirst({
      where: {
        deviceId: device.id,
        startTime: { lte: now },
        endTime: { gt: now },
      },
      include: {
        ad: {
          select: {
            fileUrl: true,
            title: true,
          },
        },
        client: true,
      },
      orderBy: {
        startTime: "asc",
      },
    });

    if (currentAssignment) {
      return NextResponse.json({
        videoUrl: currentAssignment.ad?.fileUrl || null,
        title: currentAssignment.ad?.title || "Untitled Ad",
        assignedButNotPlaying: false,
      });
    }

    // Check if the device has any assignments today (even if not currently playing)
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const futureAssignments = await prisma.clientDeviceAdAssignment.count({
      where: {
        deviceId: device.id,
        startTime: { gte: startOfDay },
        endTime: { lte: endOfDay },
      },
    });

    if (futureAssignments > 0) {
      return NextResponse.json({
        assignedButNotPlaying: true,
      });
    }

    // No assignments at all
    return NextResponse.json({
      assignedButNotPlaying: false,
    });
  } catch (err) {
    console.error("VIDEO_PLAYBACK_ERROR", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
