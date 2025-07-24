// src/app/api/agency-complaints/self/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const complaints = await prisma.agencyComplaint.findMany({
    where: { agencyId: session.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ complaints });
}
