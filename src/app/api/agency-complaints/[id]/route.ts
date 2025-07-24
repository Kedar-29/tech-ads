// src/app/api/agency-complaints/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { message } = await req.json();
  if (!message?.trim())
    return NextResponse.json({ error: "Message is required" }, { status: 400 });

  const updated = await prisma.agencyComplaint.updateMany({
    where: {
      id: params.id,
      agencyId: session.id,
      status: "PENDING",  // only allow editing if status is PENDING
    },
    data: { message: message.trim() },
  });

  if (updated.count === 0)
    return NextResponse.json({ error: "Cannot edit" }, { status: 403 });

  return NextResponse.json({ success: true });
}
