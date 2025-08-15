import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const masterId = user.id;

    const agencies = await prisma.agency.findMany({
      where: { masterId },
      select: {
        id: true,
        name: true,
        devices: { select: { id: true } },
        complaintsToMaster: { select: { status: true } },
        clients: {
          select: {
            id: true,
            complaints: { select: { status: true } },
          },
        },
      },
    });

    const agencyComplaintCounts: Record<string, Record<string, number>> = {};
    const clientsPerAgency: { agencyName: string; clientCount: number }[] = [];

    for (const agency of agencies) {
      agencyComplaintCounts[agency.name] = {};
      for (const complaint of agency.complaintsToMaster) {
        const status = complaint.status ?? "UNKNOWN";
        agencyComplaintCounts[agency.name][status] =
          (agencyComplaintCounts[agency.name][status] ?? 0) + 1;
      }

      clientsPerAgency.push({
        agencyName: agency.name,
        clientCount: agency.clients.length,
      });
    }

    const devices = await prisma.device.findMany({
      where: { masterId },
      select: { id: true, status: true },
    });

    const agencyIds = agencies.map((a) => a.id);
    const clients = await prisma.agencyClient.findMany({
      where: { agencyId: { in: agencyIds } },
      select: { id: true },
    });

    const devicesPerAgency = agencies.map((a) => ({
      agencyName: a.name,
      deviceCount: a.devices.length,
    }));

    const adsCount = await prisma.ad.count({
      where: { agencyId: { in: agencyIds } },
    });

    return NextResponse.json({
      stats: {
        totalAgencies: agencies.length,
        totalDevices: devices.length,
        totalClients: clients.length,
        devicesPerAgency,
        agencyComplaintCounts,
        clientsPerAgency,
        totalAdsCount: adsCount,
      },
    });
  } catch (error) {
    console.error("Dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
