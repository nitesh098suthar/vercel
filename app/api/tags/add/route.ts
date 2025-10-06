import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 🟡 POST: Create a new tag
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Valid tag name is required" },
        { status: 400 }
      );
    }

    // Optional: prevent duplicates
    const existing = await prisma.tag.findUnique({ where: { name } });

    if (existing) {
      return NextResponse.json(
        { error: "Tag already exists" },
        { status: 409 }
      );
    }

    const tag = await prisma.tag.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, tag }, { status: 201 });
  } catch (error) {
    console.error("Error creating tag:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
