// src/components/pdf/generateBillPdf.ts

import { PDFDocument, rgb, PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

interface Client {
  id: string;
  businessName: string;
  whatsappNumber?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  address?: string;
  email?: string;
  phone?: string;
}

interface Bill {
  id: string;
  fromDate: string;
  toDate: string;
  totalPrice: number;
  client: Client;
  items: {
    ad: { title: string };
    device: { name: string };
    playCount: number;
    totalPrice: number;
  }[];
}

export async function generateBillPdf(bill: Bill) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // Load font from public folder
  const fontBytes = await fetch("/fonts/NotoSans-Regular.ttf").then((res) =>
    res.arrayBuffer()
  );

  const font = await pdfDoc.embedFont(fontBytes);
  let page: PDFPage = pdfDoc.addPage([595, 842]); // A4
  let { height } = page.getSize();
  let y = height - 50;

  const drawText = (text: string, x: number, y: number, size = 12) => {
    page.drawText(text, {
      x,
      y,
      size,
      font,
      color: rgb(0, 0, 0),
    });
  };

  // Title
  drawText("📄 Bill Summary", 220, y, 18);
  y -= 40;

  // Client Info
  drawText(`Client: ${bill.client.businessName}`, 50, y);
  y -= 20;
  drawText(`From: ${bill.fromDate.slice(0, 10)}`, 50, y);
  y -= 20;
  drawText(`To: ${bill.toDate.slice(0, 10)}`, 50, y);
  y -= 30;

  // Table Headers
  drawText("Ad", 50, y);
  drawText("Device", 200, y);
  drawText("Hours", 350, y);
  drawText("Amount", 450, y);
  y -= 10;
  page.drawLine({
    start: { x: 50, y },
    end: { x: 540, y },
    thickness: 1,
    color: rgb(0.5, 0.5, 0.5),
  });
  y -= 10;

  // Table Rows
  for (const item of bill.items) {
    if (y < 80) {
      page = pdfDoc.addPage([595, 842]);
      height = page.getSize().height;
      y = height - 50;

      // Redraw headers
      drawText("Ad", 50, y);
      drawText("Device", 200, y);
      drawText("Hours", 350, y);
      drawText("Amount", 450, y);
      y -= 10;
      page.drawLine({
        start: { x: 50, y },
        end: { x: 540, y },
        thickness: 1,
        color: rgb(0.5, 0.5, 0.5),
      });
      y -= 10;
    }

    drawText(item.ad.title, 50, y);
    drawText(item.device.name, 200, y);
    drawText(item.playCount.toString(), 360, y);
    drawText(`₹${item.totalPrice.toFixed(2)}`, 450, y);
    y -= 20;
  }

  y -= 20;
  drawText(`Total: ₹${bill.totalPrice.toFixed(2)}`, 400, y, 14);

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
