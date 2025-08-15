import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function padInvoiceNumber(num: number) {
  return num.toString().padStart(3, "0");
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clientId, unitPrice } = await req.json();
  if (!clientId || !unitPrice || unitPrice <= 0) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  // Fetch unbilled assignments
  const assignments = await prisma.clientDeviceAdAssignment.findMany({
    where: { clientId, billed: false },
    include: { ad: true, device: true },
    orderBy: { createdAt: "asc" },
  });

  if (!assignments.length) {
    return NextResponse.json({ error: "No unbilled assignments for this client" }, { status: 404 });
  }

  // Prepare BillItems
  const itemsData = assignments.map((a) => {
    const hours = Math.max(
      0,
      (a.endTime.getTime() - a.startTime.getTime()) / (1000 * 60 * 60)
    );
    return {
      adId: a.adId,
      deviceId: a.deviceId,
      playCount: Math.ceil(hours),
      unitPrice,
      totalPrice: hours * unitPrice,
    };
  });

  const totalPrice = itemsData.reduce((sum, i) => sum + i.totalPrice, 0);

  // Generate invoice number
  const lastBill = await prisma.bill.findFirst({
    orderBy: { createdAt: "desc" },
    select: { invoiceNumber: true },
  });

  const newInvoiceNumber = lastBill?.invoiceNumber
    ? padInvoiceNumber(parseInt(lastBill.invoiceNumber) + 1)
    : "001";

  // Create Bill with BillItems
  const bill = await prisma.bill.create({
    data: {
      agencyId: session.id,
      clientId,
      fromDate: assignments[0].startTime,
      toDate: assignments[assignments.length - 1].endTime,
      totalPrice,
      invoiceNumber: newInvoiceNumber,
      items: { create: itemsData },
    },
  });

  // Mark assignments as billed
  await prisma.clientDeviceAdAssignment.updateMany({
    where: { id: { in: assignments.map((a) => a.id) } },
    data: { billed: true },
  });

  return NextResponse.json({ success: true, bill });
}
