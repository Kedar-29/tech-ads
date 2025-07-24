import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/profile/client
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "AGENCY_CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const client = await prisma.agencyClient.findUnique({
    where: { id: user.id },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  return NextResponse.json(client);
}

// PATCH /api/profile/client
export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "AGENCY_CLIENT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const updated = await prisma.agencyClient.update({
    where: { id: user.id },
    data: {
      name: body.name,
      businessName: body.businessName,
      businessEmail: body.businessEmail,
      whatsappNumber: body.whatsappNumber,
      area: body.area,
      city: body.city,
      state: body.state,
      country: body.country,
      pincode: body.pincode,
    },
  });

  return NextResponse.json(updated);
}

// ✅ Also support POST /api/profile/client
export async function POST(req: NextRequest) {
  // Redirect POST to PATCH logic for update
  return PATCH(req);
}
