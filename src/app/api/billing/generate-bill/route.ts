import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface Body {
  clientId: string;
  fromDate: string;
  toDate: string;
  unitPrice: number;
}

function padInvoiceNumber(num: number): string {
  return num.toString().padStart(3, "0").slice(0, 3);
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, fromDate, toDate, unitPrice }: Body = await req.json();

  if (!clientId || !fromDate || !toDate || !unitPrice || unitPrice <= 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const from = new Date(fromDate);
  const to = new Date(toDate);

  if (from > to) {
    return NextResponse.json(
      { error: "From date cannot be after To date" },
      { status: 400 }
    );
  }

  // Find assignments for the client in date range
  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: {
      clientId,
      startTime: { gte: from }, // use startTime and endTime range filtering
      endTime: { lte: to },
    },
  });

  if (assignments.length === 0) {
    return NextResponse.json(
      { error: "No assignments found for the specified criteria" },
      { status: 404 }
    );
  }

  const itemsData = assignments.map((a) => {
    const msDiff = a.endTime.getTime() - a.startTime.getTime();
    const hours = Math.max(0, msDiff / (1000 * 60 * 60)); // hours as float

    return {
      adId: a.adId,
      deviceId: a.deviceId,
      playCount: Math.ceil(hours), // round up or Math.floor(hours) as needed
      unitPrice,
      totalPrice: hours * unitPrice,
    };
  });

  const totalPrice = itemsData.reduce((sum, i) => sum + i.totalPrice, 0);

  // Generate invoice number: find max invoiceNumber in DB and increment
  const lastBill = await prisma.bill.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  let newInvoiceNumber = "001";

  if (lastBill?.invoiceNumber) {
    const lastNumber = parseInt(lastBill.invoiceNumber);
    if (!isNaN(lastNumber)) {
      newInvoiceNumber = padInvoiceNumber(lastNumber + 1);
    }
  }

  const bill = await prisma.bill.create({
    data: {
      agencyId: session.id,
      clientId,
      fromDate: from,
      toDate: to,
      totalPrice,
      invoiceNumber: newInvoiceNumber,
      items: { create: itemsData },
    },
  });

  return NextResponse.json({ success: true, bill });
}
