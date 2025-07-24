import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyToken } from "@/lib/jwt";

export async function GET() {
  try {
    const cookieStore = await cookies(); // ✅ await here
    const token = cookieStore.get("token")?.value;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);

    if (!decoded || decoded.role !== "MASTER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const masterId = decoded.id;

    const clients = await prisma.agencyClient.findMany({
      where: {
        agency: {
          masterId,
        },
      },
      select: {
        id: true,
        name: true,
        businessName: true,
        businessEmail: true,
        whatsappNumber: true,
        area: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
        agency: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
