import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "AGENCY") {
    const agency = await prisma.agency.findUnique({ where: { id: user.id } });
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }
    return NextResponse.json(agency);
  }

  if (user.role === "AGENCY_CLIENT") {
    const agencyClient = await prisma.agencyClient.findUnique({
      where: { id: user.id },
      select: {
        agency: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            area: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
          },
        },
      },
    });

    if (!agencyClient || !agencyClient.agency) {
      return NextResponse.json(
        { error: "Agency not found for this client" },
        { status: 404 }
      );
    }

    return NextResponse.json(agencyClient.agency);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Validate fields if needed

  const updatedAgency = await prisma.agency.update({
    where: { id: user.id },
    data: {
      name: body.name,
      email: body.email,
      phone: body.phone,
      area: body.area,
      city: body.city,
      state: body.state,
      country: body.country,
      pincode: body.pincode,
    },
  });

  return NextResponse.json(updatedAgency);
}
