import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

// Helper: format address in two lines
function formatAddressTwoLines(area?: string, city?: string, state?: string, country?: string, pincode?: string): string[] {
  const line1 = [area, city].filter(Boolean).join(", ") || "N/A";
  const line2 = [state, country, pincode].filter(Boolean).join(", ") || "N/A";
  return [line1, line2];
}

// Helper: convert number to words (INR)
function numberToWords(num: number): string {
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if(num===0) return "Zero";
  if(num<20) return a[num];
  if(num<100) return b[Math.floor(num/10)] + (num%10 ? " " + a[num%10] : "");
  if(num<1000) return a[Math.floor(num/100)] + " Hundred" + (num%100 ? " and " + numberToWords(num%100) : "");
  if(num<100000) return numberToWords(Math.floor(num/1000)) + " Thousand " + (num%1000 ? numberToWords(num%1000) : "");
  if(num<10000000) return numberToWords(Math.floor(num/100000)) + " Lakh " + (num%100000 ? numberToWords(num%100000) : "");
  return "Amount too large";
}

export async function GET(req: Request) {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "AGENCY_CLIENT") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    if (!id) return NextResponse.json({ error: "Missing bill ID" }, { status: 400 });

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: { client: true, agency: true, items: { include: { ad: true, device: true } } },
    });

    if (!bill || bill.clientId !== session.id) {
      return NextResponse.json({ error: "Bill not found or unauthorized" }, { status: 404 });
    }

    const fontPath = path.join(process.cwd(), "public/fonts/NotoSans-Regular.ttf");
    if (!fs.existsSync(fontPath)) throw new Error("Font file not found in public/fonts");

    const buffers: Buffer[] = [];
    // Set the font at creation to avoid Helvetica fallback
    const doc = new PDFDocument({ size: "A4", margin: 50, font: fontPath });

    doc.on("data", (chunk) => buffers.push(chunk));
    const pdfEndPromise = new Promise<Buffer>((resolve) => doc.on("end", () => resolve(Buffer.concat(buffers))));

    // Title
    doc.fontSize(26).fillColor("#1a202c").text("Bill Summary", { align: "center", underline: true });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor("#4a5568").text(`Invoice #: ${bill.invoiceNumber ?? "N/A"}`, { align: "center" });
    doc.moveDown(1);

    // Agency & Client Info
    const leftX = doc.page.margins.left;
    const rightX = doc.page.width / 2 + 20;
    let currentY = doc.y;

    doc.fontSize(12).fillColor("#2d3748").text("Agency Details", leftX, currentY);
    doc.text("Client Details", rightX, currentY);
    currentY += 20;

    const agencyAddressLines = formatAddressTwoLines(
      bill.agency?.area, bill.agency?.city, bill.agency?.state, bill.agency?.country, bill.agency?.pincode
    );
    const clientAddressLines = formatAddressTwoLines(
      bill.client.area, bill.client.city, bill.client.state, bill.client.country, bill.client.pincode
    );

    doc.fontSize(10);
    doc.text(`Name: ${bill.agency?.name ?? "N/A"}`, leftX, currentY);
    doc.text(`Name: ${bill.client.businessName ?? "N/A"}`, rightX, currentY);
    currentY += 18;

    doc.text(`Address: ${agencyAddressLines[0]}`, leftX, currentY);
    doc.text(`Address: ${clientAddressLines[0]}`, rightX, currentY);
    currentY += 15;
    doc.text(`${agencyAddressLines[1]}`, leftX, currentY);
    doc.text(`${clientAddressLines[1]}`, rightX, currentY);
    currentY += 18;

    doc.text(`Email: ${bill.agency?.email ?? "N/A"}`, leftX, currentY);
    doc.text(`Email: ${bill.client.businessEmail ?? "N/A"}`, rightX, currentY);
    currentY += 18;

    doc.text(`Phone: ${bill.agency?.phone ?? "N/A"}`, leftX, currentY);
    doc.text(`Phone: ${bill.client.whatsappNumber ?? "N/A"}`, rightX, currentY);
    currentY += 25;

    doc.y = currentY;

    // Dates
    doc.fontSize(11).fillColor("#2d3748");
    doc.text(`Generated On: ${new Date().toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(0.5);
    doc.text(`From: ${bill.fromDate.toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(0.5);
    doc.text(`To: ${bill.toDate.toISOString().slice(0, 10)}`, leftX, doc.y);
    doc.moveDown(1);

    // Table
    const startX = leftX;
    const tableTopY = doc.y;
    const colWidths = { ad: 180, device: 150, hours: 80, price: 100 };
    const totalTableWidth = colWidths.ad + colWidths.device + colWidths.hours + colWidths.price;
    const headerHeight = 25;

    // Header
    doc.rect(startX, tableTopY, totalTableWidth, headerHeight).fill("#e2e8f0");
    const headerTextY = tableTopY + 7;
    doc.fillColor("#1a202c").fontSize(11);
    doc.text("Ad", startX + 5, headerTextY, { width: colWidths.ad - 10, align: "left" });
    doc.text("Device", startX + colWidths.ad + 5, headerTextY, { width: colWidths.device - 10, align: "left" });
    doc.text("Hours", startX + colWidths.ad + colWidths.device + 5, headerTextY, { width: colWidths.hours - 10, align: "right" });
    doc.text("Amount (₹)", startX + colWidths.ad + colWidths.device + colWidths.hours + 5, headerTextY, { width: colWidths.price - 10, align: "right" });
    doc.strokeColor("#a0aec0").lineWidth(1).moveTo(startX, tableTopY + headerHeight).lineTo(startX + totalTableWidth, tableTopY + headerHeight).stroke();

    // Rows
    let y = tableTopY + headerHeight + 2;
    const rowHeight = 22;
    const rowTextPaddingTop = 5;
    doc.fontSize(10);

    for (let i = 0; i < bill.items.length; i++) {
      const item = bill.items[i];
      if (i % 2 === 0) doc.rect(startX, y, totalTableWidth, rowHeight).fill("#f7fafc").fillColor("#1a202c");

      const textY = y + rowTextPaddingTop;
      doc.text(item.ad.title, startX + 5, textY, { width: colWidths.ad - 10, align: "left" });
      doc.text(item.device.name, startX + colWidths.ad + 5, textY, { width: colWidths.device - 10, align: "left" });
      doc.text(`${item.playCount}`, startX + colWidths.ad + colWidths.device + 5, textY, { width: colWidths.hours - 10, align: "right" });
      doc.text(item.totalPrice.toFixed(2), startX + colWidths.ad + colWidths.device + colWidths.hours + 5, textY, { width: colWidths.price - 10, align: "right" });

      doc.strokeColor("#e2e8f0").lineWidth(1).moveTo(startX, y + rowHeight).lineTo(startX + totalTableWidth, y + rowHeight).stroke();
      y += rowHeight;

      if (y > doc.page.height - doc.page.margins.bottom - rowHeight) { doc.addPage(); y = doc.page.margins.top; }
    }

    y += 10;
    doc.fontSize(14).fillColor("#1a202c").text(`Total: ₹${bill.totalPrice.toFixed(2)}`, startX, y, { width: totalTableWidth, align: "right" });
    y += 25;
    doc.fontSize(10).fillColor("#4a5568").text(`Amount in words: ${numberToWords(Math.round(bill.totalPrice))} Rupees Only`, startX, y, { width: totalTableWidth, align: "left" });

    // Terms
    doc.moveDown(3);
    doc.fontSize(11).fillColor("#2d3748").text("Terms & Notes:", { underline: true });
    doc.fontSize(9).fillColor("#4a5568");
    doc.text("1. Payment is due within 15 days of bill generation.");
    doc.text("2. All playback data is verified via device logs.");
    doc.text("3. Disputes must be reported within 5 business days.");

    doc.end();
    const pdfBuffer = await pdfEndPromise;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="bill_${id}.pdf"` },
    });

  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
