import { NextRequest, NextResponse } from "next/server";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { Decoded } from "@/types/signup";

export async function GET(req: NextRequest) {
  try {
    // 1. Get token from header
    const authHeader = req.headers.get("authorization");
    console.log("Auth Header:", authHeader);
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.split(" ")[1];
    console.log("token", token);

    let decoded: JwtPayload | Decoded;
    try {
      const result = jwt.verify(token, process.env.JWT_SECRET!);
      if (typeof result === "string") {
        return NextResponse.json(
          { error: "Invalid Token Payload" },
          { status: 403 }
        );
      }
      decoded = result;
    } catch (err) {
      return NextResponse.json(
        { error: "Invalid Token", err },
        { status: 403 }
      );
    }
    console.log("decoded data", decoded);

    if (decoded.role === "super_admin") {
      const owners = await prisma.owner.findMany();
      return NextResponse.json(owners, { status: 200 });
    } else {
      // Normal owner → only own details
      const owner = await prisma.owner.findUnique({
        where: { id: decoded.userId },
      });
      return NextResponse.json(owner, { status: 200 });
    }
  } catch (error) {
    console.error("Error fetching owners:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
