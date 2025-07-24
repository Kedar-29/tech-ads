import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

interface UploadSuccessResponse {
  success: true;
  ad: {
    id: string;
    title: string;
    fileUrl: string;
    agencyId: string;
  };
}

interface ErrorResponse {
  error: string;
}

export async function POST(
  req: NextRequest
): Promise<NextResponse<UploadSuccessResponse | ErrorResponse>> {
  try {
    const session = await getSessionUser(req);
    if (!session || session.role !== "AGENCY") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const title = formData.get("title");
    const file = formData.get("file");

    if (typeof title !== "string" || !(file instanceof File)) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.length > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB allowed." }, { status: 413 });
    }

    const ext = path.extname(file.name);
    const fileName = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);

    const fileUrl = `/uploads/${fileName}`;

    const ad = await prisma.ad.create({
      data: {
        title,
        fileUrl,
        agencyId: session.id,
      },
    });

    return NextResponse.json({ success: true, ad });
  } catch (error) {
    console.error("UPLOAD_AD_ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
