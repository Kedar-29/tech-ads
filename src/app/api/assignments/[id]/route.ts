import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const { startTime, endTime, adId } = await req.json();

  if (!startTime || !endTime || !adId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Find existing assignment including relations
  const existing = await prisma.clientDeviceAdAssignment.findUnique({
    where: { id },
    include: { client: true, device: true, ad: true },
  });

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Validate agency ownership
  if (
    existing.client.agencyId !== session.id ||
    existing.device.agencyId !== session.id ||
    existing.ad.agencyId !== session.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Check for overlapping assignments on the same device and time range
  const overlap = await prisma.clientDeviceAdAssignment.count({
    where: {
      id: { not: id },
      deviceId: existing.deviceId,
      AND: [
        { startTime: { lt: new Date(endTime) } },
        { endTime: { gt: new Date(startTime) } },
      ],
    },
  });

  if (overlap > 0) {
    return NextResponse.json({ error: "Overlapping assignment" }, { status: 409 });
  }

  // Update the assignment
  await prisma.clientDeviceAdAssignment.update({
    where: { id },
    data: {
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      adId,
    },
  });

  // Fetch updated assignment with relations to return
  const updatedWithRelations = await prisma.clientDeviceAdAssignment.findUnique({
    where: { id },
    include: {
      client: { select: { id: true, businessName: true } },
      device: { select: { id: true, name: true } },
      ad: { select: { id: true, title: true, fileUrl: true } },
    },
  });

  return NextResponse.json({ assignment: updatedWithRelations });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.clientDeviceAdAssignment.findUnique({
    where: { id: params.id },
    include: { client: true, device: true, ad: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (
    existing.client.agencyId !== session.id ||
    existing.device.agencyId !== session.id ||
    existing.ad.agencyId !== session.id
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.clientDeviceAdAssignment.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}
