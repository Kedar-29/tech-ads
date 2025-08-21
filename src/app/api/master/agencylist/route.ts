// src/app/api/master/agencylist/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET() {
  try {
    // Get token from cookies
    const token = (await cookies()).get("token")?.value;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify token
    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "MASTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const masterId = decoded.id;

    // Fetch agencies belonging to this master
    const agencies = await prisma.agency.findMany({
      where: { masterId },
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json(agencies);
  } catch (error) {
    console.error("AGENCY_LIST_ERROR", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
