import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();

    // Find all assignments where ad play ended before or at now
    const records = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        endTime: {
          lte: now,
        },
      },
      orderBy: [{ endTime: "desc" }],
      include: {
        client: true,
        device: true,
        ad: true,
      },
    });

    // Map to the response format expected by frontend
    const history = records.map((r) => ({
      id: r.id,
      playedAt: r.endTime.toISOString(),
      ad: { title: r.ad.title },
      device: { name: r.device.name },
      client: { businessName: r.client.businessName },
    }));

    return NextResponse.json(history);
  } catch (err) {
    console.error("HISTORY_FETCH_ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch history" },
      { status: 500 }
    );
  }
}
