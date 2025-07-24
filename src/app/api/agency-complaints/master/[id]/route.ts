import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionUser(req);

  if (!session || session.role !== "MASTER")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { reply, status } = await req.json();

  if (!reply?.trim())
    return NextResponse.json({ error: "Reply is required." }, { status: 400 });

  if (!["PENDING", "RESOLVED", "REJECTED"].includes(status))
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });

  const complaint = await prisma.agencyComplaint.findUnique({
    where: { id: params.id },
  });

  if (!complaint)
    return NextResponse.json({ error: "Complaint not found." }, { status: 404 });

  if (complaint.masterId !== session.id)
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });

  const updated = await prisma.agencyComplaint.update({
    where: { id: params.id },
    data: { reply: reply.trim(), status },
  });

  return NextResponse.json({ success: true, complaint: updated });
}
