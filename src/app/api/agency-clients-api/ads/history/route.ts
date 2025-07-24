import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assignments = await prisma.clientDeviceAdAssignment.findMany({
      where: {
        device: {
          agencyId: user.id, // assuming user.id is agencyId
        },
        date: {
          lte: new Date(),
        },
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
        date: "desc",
      },
    });

    return NextResponse.json(assignments);
  } catch (error) {
    console.error("[ADS_HISTORY_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
