import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type ComplaintStatus = "PENDING" | "RESOLVED" | "REJECTED";

async function getCurrentAgencyId(req: NextRequest): Promise<string | null> {
  const user = await getSessionUser(req);
  if (user?.role === "AGENCY") return user.id;
  return null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agencyId = await getCurrentAgencyId(req);
    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaint = await prisma.clientComplaint.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        message: true,
        reply: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            businessName: true,
            businessEmail: true,
          },
        },
        agencyId: true,
      },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }

    if (complaint.agencyId !== agencyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { agencyId: _agencyId, ...result } = complaint;

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching complaint:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaint" },
      { status: 500 }
    );
  }
}

interface UpdateComplaintBody {
  reply: string;
  status: ComplaintStatus;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const agencyId = await getCurrentAgencyId(req);
    if (!agencyId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: UpdateComplaintBody = await req.json();

    if (!body.reply || typeof body.reply !== "string" || !body.reply.trim()) {
      return NextResponse.json({ error: "Reply is required" }, { status: 400 });
    }
    if (!["PENDING", "RESOLVED", "REJECTED"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const complaint = await prisma.clientComplaint.findUnique({
      where: { id: params.id },
    });

    if (!complaint) {
      return NextResponse.json({ error: "Complaint not found" }, { status: 404 });
    }
    if (complaint.agencyId !== agencyId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updated = await prisma.clientComplaint.update({
      where: { id: params.id },
      data: {
        reply: body.reply.trim(),
        status: body.status,
      },
      select: {
        id: true,
        message: true,
        reply: true,
        status: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
            businessName: true,
            businessEmail: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating complaint:", error);
    return NextResponse.json(
      { error: "Failed to update complaint" },
      { status: 500 }
    );
  }
}
