import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import bcrypt from "bcryptjs";

interface AgencyClientRequestBody {
  name: string;
  businessName: string;
  businessEmail: string;
  password: string;
  whatsappNumber: string;
  area: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
}

export async function POST(req: Request) {
  try {
    const session = await getSessionUser(req);

    if (!session || session.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: AgencyClientRequestBody = await req.json();
    const {
      name,
      businessName,
      businessEmail,
      password,
      whatsappNumber,
      area,
      city,
      state,
      country,
      pincode,
    } = body;

    if (
      !name ||
      !businessName ||
      !businessEmail ||
      !password ||
      !whatsappNumber ||
      !area ||
      !city ||
      !state ||
      !country ||
      !pincode
    ) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newClient = await prisma.agencyClient.create({
      data: {
        name,
        businessName,
        businessEmail,
        password: hashedPassword,
        whatsappNumber,
        area,
        city,
        state,
        country,
        pincode,
        agencyId: session.id,
      },
    });

    return NextResponse.json({ success: true, client: newClient });
  } catch (error) {
    console.error("CREATE_AGENCY_CLIENT_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
        name: true,
        businessName: true,
        businessEmail: true,
        whatsappNumber: true,
        area: true,
        city: true,
        state: true,
        country: true,
        pincode: true,
      },
    });

    return NextResponse.json(clients);
  } catch (error) {
    console.error("FETCH_AGENCY_CLIENTS_ERROR", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
