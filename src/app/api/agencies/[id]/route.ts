// src/app/api/agencies/[id]/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Define the expected shape of the request body for PUT
interface AgencyData {
  name: string;
  email: string;
  phone: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

// PUT /api/agencies/[id] - Update agency
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body: AgencyData = await req.json();

    const updated = await prisma.agency.update({
      where: { id },
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("AGENCY_UPDATE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update agency" },
      { status: 500 }
    );
  }
}

// DELETE /api/agencies/[id] - Delete agency
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await prisma.agency.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("AGENCY_DELETE_ERROR", error);
    return NextResponse.json(
      { error: "Failed to delete agency" },
      { status: 500 }
    );
  }
}
