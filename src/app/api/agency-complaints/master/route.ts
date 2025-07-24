// src/app/api/agency-complaints/master/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "MASTER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const agencyId = url.searchParams.get("agencyId") || undefined;

  const complaints = await prisma.agencyComplaint.findMany({
    where: { masterId: session.id, agencyId },
    include: { agency: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
