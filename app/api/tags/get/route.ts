// 🟢 GET: Fetch all tags
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const tags = await prisma.tag.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, tags }, { status: 200 });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 }
    );
  }
}
