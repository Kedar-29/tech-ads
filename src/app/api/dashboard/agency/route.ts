import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agencyId = user.id;

    const agency = await prisma.agency.findUnique({
      where: { id: agencyId },
      select: {
        devices: { select: { id: true, status: true } },
        clients: {
          select: {
            id: true,
            name: true,
            devices: { select: { id: true } },
            complaints: { select: { status: true } },
          },
        },
        ads: { select: { id: true, title: true } },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // 1. Device Status Counts
    const deviceStatusCounts: Record<string, number> = {};
    let totalDevices = 0;
    for (const device of agency.devices) {
      const status = device.status ?? "UNKNOWN";
      deviceStatusCounts[status] = (deviceStatusCounts[status] ?? 0) + 1;
      totalDevices++;
    }

    // 2. Devices per Client
    const devicesPerClient = agency.clients.map((client) => ({
      clientName: client.name,
      deviceCount: client.devices.length,
    }));

    // 3. Complaint Counts per Client
    const clientComplaintCounts: Record<string, Record<string, number>> = {};
    for (const client of agency.clients) {
      clientComplaintCounts[client.name] = {};
      for (const complaint of client.complaints) {
        const status = complaint.status ?? "UNKNOWN";
        clientComplaintCounts[client.name][status] =
          (clientComplaintCounts[client.name][status] ?? 0) + 1;
      }
    }

    // 4. Total Ads
    const totalAdsCount = agency.ads.length;

    // 5. Ads Assigned per Client
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        clientId: {
          in: agency.clients.map((c) => c.id),
        },
      },
      select: {
        adId: true,
        client: {
          select: {
            name: true,
          },
        },
      },
    });

    const clientAdMap: Record<string, Set<string>> = {};
    for (const assignment of assignments) {
      const clientName = assignment.client.name;
      if (!clientAdMap[clientName]) {
        clientAdMap[clientName] = new Set();
      }
      clientAdMap[clientName].add(assignment.adId);
    }

    const adsAssignedPerClient = Object.entries(clientAdMap).map(
      ([clientName, adSet]) => ({
        clientName,
        assignedAdCount: adSet.size,
      })
    );

    // Final Response
    return NextResponse.json({
      stats: {
        totalDevices,
        totalClients: agency.clients.length,
        totalAdsCount,
        deviceStatusCounts,
        devicesPerClient,
        clientComplaintCounts,
        adsAssignedPerClient,
      },
    });
  } catch (error) {
    console.error("Agency dashboard fetch error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
