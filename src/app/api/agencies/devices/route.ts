import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const devices = await prisma.device.findMany({
      where: { agencyId: session.id },
      orderBy: { name: "asc" },
      select: {
        id: true,
        uuid: true,
        name: true,
        model: true,
        size: true,
        latitude: true,
        longitude: true,
        apiEndpoint: true,
        publicKey: true,
        secretKey: true,
        status: true,
      },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("GET_AGENCY_DEVICES_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
