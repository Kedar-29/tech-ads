// src/app/api/agency-complaints/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { message } = await req.json();
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // Fetch masterId from DB based on agency id (session.id)
  const agency = await prisma.agency.findUnique({
    where: { id: session.id },
    select: { masterId: true },
  });

  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  await prisma.agencyComplaint.create({
    data: {
      message: message.trim(),
      agencyId: session.id,
      masterId: agency.masterId,  // use fetched masterId here
    },
  });

  return NextResponse.json({ success: true }, { status: 201 });
}
