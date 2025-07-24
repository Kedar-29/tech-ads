import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";


export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();

    const {
      name,
      model,
      size,
      latitude,
      longitude,
      agencyId,
      apiEndpoint,
      status,
    } = body;

    if (
      !name ||
      !model ||
      !size ||
      latitude === undefined ||
      longitude === undefined ||
      !agencyId ||
      !apiEndpoint
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const device = await prisma.device.findUnique({ where: { id } });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.masterId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updatedDevice = await prisma.device.update({
      where: { id },
      data: {
        name,
        model,
        size,
        latitude,
        longitude,
        agencyId,
        apiEndpoint,
        status,
      },
    });

    return NextResponse.json({ success: true, device: updatedDevice });
  } catch (error) {
    console.error("PATCH_DEVICE_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const device = await prisma.device.findUnique({
      where: { id },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.masterId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.device.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE_DEVICE_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;

    const device = await prisma.device.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        model: true,
        size: true,
        status: true,
        apiEndpoint: true,
        publicKey: true,
        secretKey: true,
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!device) {
      return NextResponse.json({ error: "Device not found" }, { status: 404 });
    }

    if (device.agency === null) {
      // Optionally: you can set agency to null explicitly or leave as is
    }

    return NextResponse.json(device);
  } catch (error) {
    console.error("GET_DEVICE_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}