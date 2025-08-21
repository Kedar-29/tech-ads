import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== "MASTER")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const masterId = decoded.id;

    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get("page") ?? "1");
    const pageSize = parseInt(url.searchParams.get("pageSize") ?? "10");
    const agencyId = url.searchParams.get("agencyId");

    const whereClause = {
      agency: { masterId, ...(agencyId ? { id: agencyId } : {}) },
    };

    const totalClients = await prisma.agencyClient.count({
      where: whereClause,
    });

    const clients = await prisma.agencyClient.findMany({
      where: whereClause,
      include: { agency: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ clients, totalClients });
  } catch (error) {
    console.error("CLIENTS_FETCH_ERROR", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
