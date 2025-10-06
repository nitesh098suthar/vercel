import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const items = await prisma.item.findMany({
      include: {
        categories: true,
        tags: true,
        levels: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 }
    );
  }
}
