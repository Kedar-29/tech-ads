import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface UpdateComplaintBody {
  message: string;
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaintId = params.id;

    const body: UpdateComplaintBody = await req.json();

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Find complaint to check ownership and status
    const complaint = await prisma.clientComplaint.findUnique({
      where: { id: complaintId },
      select: { clientId: true, status: true },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (complaint.clientId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (complaint.status !== "PENDING") {
      return NextResponse.json({ error: "Cannot edit complaint once it is resolved or rejected" }, { status: 400 });
    }

    // Update message
    const updated = await prisma.clientComplaint.update({
      where: { id: complaintId },
      data: { message: body.message.trim() },
      select: {
        id: true,
        message: true,
        reply: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json({ error: "Failed to update complaint" }, { status: 500 });
  }
}
