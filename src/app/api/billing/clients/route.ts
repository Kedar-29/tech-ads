import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clients = await prisma.agencyClient.findMany({
      where: { agencyId: session.id },
      select: {
        id: true,
        businessName: true,
        whatsappNumber: true,
        area: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
      },
    });

    return NextResponse.json({ clients });
  } catch (err) {
    console.error("CLIENT_FETCH_ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
