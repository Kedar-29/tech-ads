import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const complaints = await prisma.clientComplaint.findMany({
      where: { clientId: user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        message: true,
        status: true,
        reply: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ complaints });
  } catch (error) {
    console.error("Error fetching client complaints:", error);
    return NextResponse.json(
      { error: "Failed to fetch complaints" },
      { status: 500 }
    );
  }
}

interface CreateComplaintBody {
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);
    if (!user || user.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: CreateComplaintBody = await req.json();

    if (!body.message || !body.message.trim()) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // Fetch agencyId for this client from DB
    const client = await prisma.agencyClient.findUnique({
      where: { id: user.id },
      select: { agencyId: true },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Create complaint with agencyId from DB
    const complaint = await prisma.clientComplaint.create({
      data: {
        message: body.message.trim(),
        status: "PENDING",
        clientId: user.id,
        agencyId: client.agencyId, // <-- here is the fix
      },
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ complaint }, { status: 201 });
  } catch (error) {
    console.error("Error creating complaint:", error);
    return NextResponse.json(
      { error: "Failed to create complaint" },
      { status: 500 }
    );
  }
}
