// src/app/api/ads/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs/promises";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const ad = await prisma.ad.findUnique({
    where: { id },
    select: { id: true, title: true, fileUrl: true, agencyId: true },
  });

  if (!ad || ad.agencyId !== session.id) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }
  return NextResponse.json(ad);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.agencyId !== session.id) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  const formData = await req.formData();
  const title = formData.get("title");
  const file = formData.get("file");

  if (typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  let fileUrl = ad.fileUrl;
  if (file instanceof File) {
    if (!file.type.startsWith("video/")) {
      return NextResponse.json({ error: "Only video files are allowed" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    if (fileBuffer.length > 50 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 50MB allowed." }, { status: 413 });
    }

    // Delete old file safely
    try {
      const oldPath = path.join(process.cwd(), "public", ad.fileUrl);
      await fs.unlink(oldPath);
    } catch {
      // ignore errors
    }

    const ext = path.extname(file.name);
    const fileName = `${randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), "public/uploads");
    const filePath = path.join(uploadDir, fileName);

    await fs.mkdir(uploadDir, { recursive: true });
    await fs.writeFile(filePath, fileBuffer);
    fileUrl = `/uploads/${fileName}`;
  }

  const updatedAd = await prisma.ad.update({
    where: { id },
    data: { title, fileUrl },
    select: { id: true, title: true, fileUrl: true, agencyId: true },
  });

  return NextResponse.json(updatedAd);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSessionUser(req);
  if (!session || session.role !== "AGENCY") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  const ad = await prisma.ad.findUnique({ where: { id } });
  if (!ad || ad.agencyId !== session.id) {
    return NextResponse.json({ error: "Ad not found" }, { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "public", ad.fileUrl);
    await fs.unlink(filePath);
  } catch {
    // ignore errors
  }

  await prisma.ad.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
