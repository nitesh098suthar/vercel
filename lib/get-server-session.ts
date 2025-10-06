// lib/getServerUser.ts
import { NextRequest } from "next/server";
import { verifyJwt } from "./verify-token";

export interface DecodedUser {
  id: string;
  role: string;
}

export function getServerUser(req: NextRequest): DecodedUser | null {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return null;

    const token = authHeader.split(" ")[1];
    if (!token) return null;

    const decoded = verifyJwt(token) as DecodedUser;
    return decoded;
  } catch (err) {
    console.error("JWT verification failed:", err);
    return null;
  }
}
