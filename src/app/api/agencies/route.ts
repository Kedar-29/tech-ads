// src/app/api/agencies/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name,
      email,
      password,
      phone,
      area,
      city,
      state,
      country,
      pincode,
    } = body;

    if (
      !name ||
      !email ||
      !password ||
      !phone ||
      !area ||
      !city ||
      !state ||
      !country ||
      !pincode
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Hash password before saving (use bcryptjs or similar)
    const bcrypt = (await import("bcryptjs")).default;
    const hashedPassword = await bcrypt.hash(password, 10);

    const agency = await prisma.agency.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        area,
        city,
        state,
        country,
        pincode,
        masterId: session.id,
      },
    });

    return NextResponse.json({ success: true, agency });
  } catch (error) {
    console.error("CREATE_AGENCY_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// Added GET handler to fetch all agencies
export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "MASTER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch agencies for this master
    const agencies = await prisma.agency.findMany({
      where: { masterId: session.id },
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
    });

    return NextResponse.json(agencies);
  } catch (error) {
    console.error("FETCH_AGENCIES_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}