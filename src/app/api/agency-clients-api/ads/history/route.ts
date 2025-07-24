import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    console.log("User from token:", user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized: no user" }, { status: 401 });
    }

    if (user.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized: wrong role" }, { status: 401 });
    }

    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        clientId: user.id, // Filter assignments by logged-in client ID
      },
      include: {
        ad: {
          select: {
            id: true,
            title: true,
            fileUrl: true,
          },
        },
        device: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = assignments.map((assignment) => ({
      id: assignment.id,
      date: assignment.createdAt.toISOString(),
      ad: assignment.ad,
      device: assignment.device,
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ADS_HISTORY_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
