import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const agencyId = session.id;

  const clients = await prisma.agencyClient.findMany({
    where: { agencyId },
    select: { id: true, businessName: true },
  });

  const devices = await prisma.device.findMany({
    where: { agencyId },
    select: { id: true, name: true },
  });

  const ads = await prisma.ad.findMany({
    where: { agencyId },
    select: { id: true, title: true },
  });

  return NextResponse.json({ clients, devices, ads });
}
