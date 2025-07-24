// src/app/api/master/agency/ads/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    const token = (await cookies()).get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "MASTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const masterId = decoded.id;
    const now = new Date();

    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        device: {
          agency: {
            masterId,
          },
        },
        startTime: {
          lte: now,
        },
        endTime: {
          gte: now,
        },
      },
      orderBy: {
        startTime: "desc", // ✅ FIXED
      },
      include: {
        ad: true,
        device: true,
        client: true, // ✅ FIXED
      },
    });

    const result = assignments.map((a) => ({
      id: a.id,
      adTitle: a.ad.title,
      deviceName: a.device.name,
      clientName: a.client.name,
      date: a.startTime.toISOString().slice(0, 10),
      startTime: a.startTime.toISOString().slice(11, 16),
      endTime: a.endTime.toISOString().slice(11, 16),
      adPreviewUrl: a.ad.fileUrl,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("LIVE_ADS_ERROR", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
