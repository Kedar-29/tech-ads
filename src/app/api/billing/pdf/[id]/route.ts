// src/app/api/billing/pdf/[id]/route.ts

import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PDFKit from "pdfkit";

// Helper: format address parts
function formatAddress(
  area?: string,
  city?: string,
  state?: string,
  country?: string,
  pincode?: string
): string {
  return [area, city, state, country, pincode].filter(Boolean).join(", ") || "N/A";
}

// Helper: convert number to words (INR) — simplified, supports up to lakhs
function numberToWords(num: number): string {
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  if (num === 0) return "Zero";

  if (num < 20) return a[num];

  if (num < 100) return b[Math.floor(num / 10)] + (num % 10 ? " " + a[num % 10] : "");

  if (num < 1000) {
    return (
      a[Math.floor(num / 100)] +
      " Hundred" +
      (num % 100 ? " and " + numberToWords(num % 100) : "")
    );
  }

  if (num < 100000) {
    return (
      numberToWords(Math.floor(num / 1000)) +
      " Thousand " +
      (num % 1000 ? numberToWords(num % 1000) : "")
    );
  }

  if (num < 10000000) {
    return (
      numberToWords(Math.floor(num / 100000)) +
      " Lakh " +
      (num % 100000 ? numberToWords(num % 100000) : "")
    );
  }

  return "Amount too large";
}

export async function GET(req: Request) {
  try {
    // Get logged-in user session and check role
    const session = await getSessionUser(req);
    if (!session || session.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract bill ID from URL
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();

    if (!id) {
      return NextResponse.json({ error: "Missing bill ID" }, { status: 400 });
    }

    // Fetch bill with related client, agency, and bill items
    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        client: true,
        agency: true,
        items: {
          include: {
            ad: true,
            device: true,
          },
        },
      },
    });

    if (!bill || bill.agencyId !== session.id) {
      return NextResponse.json({ error: "Bill not found or unauthorized" }, { status: 404 });
    }

    const buffers: Buffer[] = [];

    // Create PDF document and collect chunks
    const doc = new PDFKit({ size: "A4", margin: 50 });
    doc.on("data", (chunk) => buffers.push(chunk));
    const pdfEndPromise = new Promise<Buffer>((resolve) =>
      doc.on("end", () => resolve(Buffer.concat(buffers)))
    );

    // Title + Invoice Number
    doc.fontSize(26).fillColor("#1a202c").text("Bill Summary", {
      align: "center",
      underline: true,
    });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("#4a5568").text(
      `Invoice #: ${bill.invoiceNumber ?? "N/A"}`,
      { align: "center" }
    );
    doc.moveDown(1);

    // Agency & Client Info side by side
    const leftX = doc.page.margins.left;
    const rightX = doc.page.width / 2 + 20;
    let currentY = doc.y;

    doc.fontSize(12).fillColor("#2d3748").text("Agency Details", leftX, currentY);
    doc.text("Client Details", rightX, currentY);
    currentY += 18;

    doc.fontSize(10);

    doc.text(`Name: ${bill.agency?.name ?? "N/A"}`, leftX, currentY);
    doc.text(`Name: ${bill.client.businessName ?? "N/A"}`, rightX, currentY);
    currentY += 15;

    const agencyAddress = formatAddress(
      bill.agency?.area,
      bill.agency?.city,
      bill.agency?.state,
      bill.agency?.country,
      bill.agency?.pincode
    );

    const clientAddress = formatAddress(
      bill.client.area,
      bill.client.city,
      bill.client.state,
      bill.client.country,
      bill.client.pincode
    );

    doc.text(`Address: ${agencyAddress}`, leftX, currentY);
    doc.text(`Address: ${clientAddress}`, rightX, currentY);
    currentY += 15;

    doc.text(`Email: ${bill.agency?.email ?? "N/A"}`, leftX, currentY);
    doc.text(`Email: ${bill.client.businessEmail ?? "N/A"}`, rightX, currentY);
    currentY += 15;

    doc.text(`Phone: ${bill.agency?.phone ?? "N/A"}`, leftX, currentY);
    doc.text(`Phone: ${bill.client.whatsappNumber ?? "N/A"}`, rightX, currentY);
    currentY += 30;

    doc.y = currentY;

    // Dates section
    doc.fontSize(11).fillColor("#2d3748");
    doc.text(`Generated On: ${new Date().toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(0.5);
    doc.text(`From: ${bill.fromDate.toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(0.5);
    doc.text(`To: ${bill.toDate.toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(1);

    // Horizontal line
    doc.strokeColor("#cbd5e0").lineWidth(1);
    doc.moveTo(leftX, doc.y);
    doc.lineTo(doc.page.width - doc.page.margins.right, doc.y);
    doc.stroke();
    doc.moveDown(0.5);

    // Table columns setup
    const startX = leftX;
    const tableTopY = doc.y;
    const colWidths = {
      ad: 180,
      device: 150,
      hours: 80,
      price: 100,
    };
    const totalTableWidth = colWidths.ad + colWidths.device + colWidths.hours + colWidths.price;
    const headerHeight = 25;

    // Table header background & text
    doc.rect(startX, tableTopY, totalTableWidth, headerHeight).fill("#e2e8f0");
    const headerTextY = tableTopY + 7;
    doc.fillColor("#1a202c").fontSize(11);
    doc.text("Ad", startX + 5, headerTextY, { width: colWidths.ad - 10, align: "left" });
    doc.text("Device", startX + colWidths.ad + 5, headerTextY, { width: colWidths.device - 10, align: "left" });
    doc.text("Hours", startX + colWidths.ad + colWidths.device + 5, headerTextY, {
      width: colWidths.hours - 10,
      align: "right",
    });
    doc.text("Amount (₹)", startX + colWidths.ad + colWidths.device + colWidths.hours + 5, headerTextY, {
      width: colWidths.price - 10,
      align: "right",
    });

    // Header underline
    doc.strokeColor("#a0aec0").lineWidth(1);
    doc.moveTo(startX, tableTopY + headerHeight);
    doc.lineTo(startX + totalTableWidth, tableTopY + headerHeight);
    doc.stroke();

    // Table rows
    let y = tableTopY + headerHeight + 2;
    const rowHeight = 22;
    const rowTextPaddingTop = 5;
    doc.fontSize(10);

    for (let i = 0; i < bill.items.length; i++) {
      const item = bill.items[i];

      if (i % 2 === 0) {
        doc.rect(startX, y, totalTableWidth, rowHeight).fill("#f7fafc");
        doc.fillColor("#1a202c");
      }

      const textY = y + rowTextPaddingTop;
      doc.text(item.ad.title, startX + 5, textY, { width: colWidths.ad - 10, align: "left" });
      doc.text(item.device.name, startX + colWidths.ad + 5, textY, {
        width: colWidths.device - 10,
        align: "left",
      });
      doc.text(`${item.playCount}`, startX + colWidths.ad + colWidths.device + 5, textY, {
        width: colWidths.hours - 10,
        align: "right",
      });
      doc.text(item.totalPrice.toFixed(2), startX + colWidths.ad + colWidths.device + colWidths.hours + 5, textY, {
        width: colWidths.price - 10,
        align: "right",
      });

      doc.strokeColor("#e2e8f0").lineWidth(1);
      doc.moveTo(startX, y + rowHeight);
      doc.lineTo(startX + totalTableWidth, y + rowHeight);
      doc.stroke();

      y += rowHeight;

      if (y > doc.page.height - doc.page.margins.bottom - rowHeight) {
        doc.addPage();
        y = doc.page.margins.top;
      }
    }

    // GST calculation: 18% of totalPrice
    const gstRate = 0.18;
    const gstAmount = bill.totalPrice * gstRate;
    const totalWithGST = bill.totalPrice + gstAmount;

    // Total summary section
    doc.moveDown(0.5);
    doc.strokeColor("#cbd5e0").lineWidth(1);
    doc.moveTo(startX, y + 5);
    doc.lineTo(startX + totalTableWidth, y + 5);
    doc.stroke();

    doc.fontSize(12).fillColor("#2d3748");
    doc.text(`Subtotal: ₹${bill.totalPrice.toFixed(2)}`, startX + totalTableWidth - colWidths.price, y + 10, {
      width: colWidths.price,
      align: "right",
    });

    y += 20;
    doc.text(`GST (18%): ₹${gstAmount.toFixed(2)}`, startX + totalTableWidth - colWidths.price, y + 10, {
      width: colWidths.price,
      align: "right",
    });

    y += 20;
    doc.fontSize(14).fillColor("#1a202c").text(
      `Total (incl. GST): ₹${totalWithGST.toFixed(2)}`,
      startX,
      y + 10,
      {
        width: totalTableWidth,
        align: "right",
      }
    );

    y += 30;

    // Amount in words
    doc.fontSize(10).fillColor("#4a5568");
    doc.text(`Amount in words: ${numberToWords(Math.round(totalWithGST))} Rupees Only`, startX, y, {
      width: totalTableWidth,
      align: "left",
    });

    // Terms & Notes section
    doc.moveDown(3);
    doc.fontSize(11).fillColor("#2d3748").text("Terms & Notes:", { underline: true });
    doc.fontSize(9).fillColor("#4a5568");
    doc.text("1. Payment is due within 15 days of bill generation.");
    doc.text("2. All playback data is verified via device logs.");
    doc.text("3. Disputes must be reported within 5 business days.");

    // Finalize PDF
    doc.end();
    const pdfBuffer = await pdfEndPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="bill_${id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
