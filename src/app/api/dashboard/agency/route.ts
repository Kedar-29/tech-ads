import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface ClientDevices {
  clientName: string;
  deviceCount: number;
}

interface ClientAds {
  clientName: string;
  assignedAdCount: number;
}

interface ClientComplaints {
  [status: string]: number;
}

interface ClientBilling {
  clientName: string;
  totalBill: number;
}

interface StatsData {
  totalDevices: number;
  totalClients: number;
  totalAdsCount: number;
  devicesPerClient: ClientDevices[];
  clientComplaintCounts: Record<string, ClientComplaints>;
  adsAssignedPerClient: ClientAds[];
  clientBilling: ClientBilling[];
}

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
        devices: { select: { id: true } },
        clients: {
          select: {
            id: true,
            name: true,
            devices: { select: { id: true } },
            complaints: { select: { status: true } },
            bills: { select: { totalPrice: true } },
          },
        },
        ads: { select: { id: true } },
      },
    });

    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    // 1️⃣ Total devices
    const totalDevices = agency.devices.length;

    // 2️⃣ Devices per client
    const devicesPerClient: ClientDevices[] = agency.clients.map((c) => ({
      clientName: c.name,
      deviceCount: c.devices.length,
    }));

    // 3️⃣ Client complaints
    const clientComplaintCounts: Record<string, ClientComplaints> = {};
    for (const client of agency.clients) {
      const complaints: ClientComplaints = {};
      for (const complaint of client.complaints) {
        const status = complaint.status ?? "UNKNOWN";
        complaints[status] = (complaints[status] ?? 0) + 1;
      }
      clientComplaintCounts[client.name] = complaints;
    }

    // 4️⃣ Total ads
    const totalAdsCount = agency.ads.length;

    // 5️⃣ Ads assigned per client
    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: { clientId: { in: agency.clients.map((c) => c.id) } },
      select: { client: { select: { name: true } }, adId: true },
    });

    const clientAdMap: Record<string, Set<string>> = {};
    for (const assignment of assignments) {
      const clientName = assignment.client.name;
      if (!clientAdMap[clientName]) clientAdMap[clientName] = new Set();
      clientAdMap[clientName].add(assignment.adId);
    }

    const adsAssignedPerClient: ClientAds[] = Object.entries(clientAdMap).map(
      ([clientName, adSet]) => ({
        clientName,
        assignedAdCount: adSet.size,
      })
    );

    // 6️⃣ Client Billing
    const clientBilling: ClientBilling[] = agency.clients.map((client) => ({
      clientName: client.name,
      totalBill: client.bills.reduce((sum, bill) => sum + bill.totalPrice, 0),
    }));

    // ✅ Return stats
    const stats: StatsData = {
      totalDevices,
      totalClients: agency.clients.length,
      totalAdsCount,
      devicesPerClient,
      clientComplaintCounts,
      adsAssignedPerClient,
      clientBilling,
    };

    return NextResponse.json({ stats });
  } catch (err) {
    console.error("Agency dashboard fetch error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
