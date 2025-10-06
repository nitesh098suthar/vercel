import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function GET() {
  try {
    const levels = await prisma.level.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, levels }, { status: 200 });
  } catch (error) {
    console.error("Error fetching levels:", error);
    return NextResponse.json(
      { error: "Failed to fetch levels" },
      { status: 500 }
    );
  }
}
