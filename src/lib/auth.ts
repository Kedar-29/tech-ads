// src/lib/auth.ts
import { NextRequest } from "next/server";
import { verifyToken, JWTPayload } from "./jwt";

export async function getSessionUser(req: Request): Promise<JWTPayload | null> {
  // Cast to NextRequest for cookie handling (Next.js 13 app router)
  const nextReq = req as NextRequest;

  // Get token from cookies
  const token = nextReq.cookies.get("token")?.value;

  if (!token) return null;

  const user = verifyToken(token);
  return user;
}
