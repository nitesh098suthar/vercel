// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🟢 GET: Fetch all categories
export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}
