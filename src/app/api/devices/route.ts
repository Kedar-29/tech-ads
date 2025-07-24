// src/app/api/agencies/devices/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, model, size, latitude, longitude, agencyId } = body;

    if (
      !name ||
      !model ||
      !size ||
      latitude === undefined ||
      longitude === undefined ||
      !agencyId
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Generate UUIDs & keys
    const uuid = crypto.randomUUID();
    const apiEndpoint = `/api/device/${uuid}/ads`;
    const publicKey = crypto.randomUUID();
    const secretKey = crypto.randomUUID();

    // Create the device record
    const device = await prisma.device.create({
      data: {
        uuid,
        name,
        model,
        size,
        latitude,
        longitude,
        apiEndpoint,
        publicKey,
        secretKey,
        masterId: session.id,  // your model requires this
        agencyId,              // from client
        clientId: null,        // initially unassigned
      },
    });

    return NextResponse.json({ success: true, device });
  } catch (error) {
    console.error("CREATE_DEVICE_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const devices = await prisma.device.findMany({
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
        agencyId: true,
        clientId: true, // included so frontend can know assigned client
      },
    });

    return NextResponse.json(devices);
  } catch (error) {
    console.error("GET_DEVICES_ERROR", error);
    return NextResponse.json({ error: "Failed to fetch devices" }, { status: 500 });
  }
}
