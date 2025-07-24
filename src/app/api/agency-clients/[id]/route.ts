import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // Adjust your prisma import

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    await prisma.agencyClient.delete({ where: { id } });
    return NextResponse.json({ message: "Client deleted successfully" }, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete client" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await request.json();

  try {
    const updatedClient = await prisma.agencyClient.update({
      where: { id },
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
    return NextResponse.json(updatedClient, { status: 200 });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return NextResponse.json({ error: "Failed to update client" }, { status: 500 });
  }
}
