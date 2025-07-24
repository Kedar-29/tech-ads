import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

interface UpdateStatusRequest {
  billId: string;
  status: "PENDING" | "PAID" | "DELAYED";
}

export async function PATCH(req: Request) {
  const session = await getSessionUser(req);

  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { billId, status }: UpdateStatusRequest = await req.json();

    if (!billId || !status) {
      return NextResponse.json(
        { error: "billId and status are required" },
        { status: 400 }
      );
    }

    // Optional: Validate status value explicitly
    const allowedStatuses = ["PENDING", "PAID", "DELAYED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // Ensure the bill belongs to the agency
    const existingBill = await prisma.bill.findUnique({
      where: { id: billId },
      select: { agencyId: true },
    });

    if (!existingBill || existingBill.agencyId !== session.id) {
      return NextResponse.json(
        { error: "Bill not found or unauthorized" },
        { status: 404 }
      );
    }

    await prisma.bill.update({
      where: { id: billId },
      data: { status },
    });

    return NextResponse.json({ message: "Bill status updated" });
  } catch (error) {
    console.error("UPDATE_BILL_STATUS_ERROR", error);
    return NextResponse.json(
      { error: "Failed to update bill status" },
      { status: 500 }
    );
  }
}
