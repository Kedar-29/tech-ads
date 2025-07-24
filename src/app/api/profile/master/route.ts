import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.role === "MASTER") {
    // Return master info for the logged in master
    const master = await prisma.master.findUnique({ where: { id: user.id } });
    if (!master) {
      return NextResponse.json({ error: "Master not found" }, { status: 404 });
    }
    return NextResponse.json(master);
  }

  if (user.role === "AGENCY") {
    // Find agency's master
    const agency = await prisma.agency.findUnique({ where: { id: user.id } });
    if (!agency || !agency.masterId) {
      return NextResponse.json({ error: "Master not found for agency" }, { status: 404 });
    }
    const master = await prisma.master.findUnique({ where: { id: agency.masterId } });
    if (!master) {
      return NextResponse.json({ error: "Master not found" }, { status: 404 });
    }
    return NextResponse.json(master);
  }

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}


export async function PATCH(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user || user.role !== "MASTER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  // Optional: add validation here for name, email, etc.

  const updatedMaster = await prisma.master.update({
    where: { id: user.id },
    data: {
      name: body.name,
      email: body.email,
      // Add other fields if needed
    },
  });

  return NextResponse.json(updatedMaster);
}
