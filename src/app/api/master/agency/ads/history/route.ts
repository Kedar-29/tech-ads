import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getSessionUser(req);

  if (!user || (user.role !== "MASTER" && user.role !== "AGENCY")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const today = new Date();

    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        endTime: { lt: today }, // Ad has completed
        ...(user.role === "AGENCY"
          ? {
              device: {
                agencyId: user.id,
              },
            }
          : {}),
      },
      include: {
        ad: {
          select: { title: true },
        },
        device: {
          select: { name: true },
        },
        client: {
          select: { businessName: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const transformed = assignments.map((a) => {
      const durationMs =
        new Date(a.endTime).getTime() - new Date(a.startTime).getTime();
      const durationHours = (durationMs / (1000 * 60 * 60)).toFixed(2);

      return {
        id: a.id,
        adTitle: a.ad.title,
        deviceName: a.device.name,
        clientName: a.client.businessName,
        playedAt: a.createdAt.toISOString(),
        duration: `${durationHours} hour${durationHours !== "1.00" ? "s" : ""}`,
      };
    });

    return NextResponse.json(transformed);
  } catch (error) {
    console.error("Error loading completed ads:", error);
    return NextResponse.json(
      { error: "Failed to fetch completed ad data" },
      { status: 500 }
    );
  }
}
