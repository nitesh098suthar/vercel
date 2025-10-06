// app/api/levels/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    // Validate name
    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Valid level name is required" },
        { status: 400 }
      );
    }

    // Check if level already exists (optional but recommended)
    const existing = await prisma.level.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Level already exists" },
        { status: 409 }
      );
    }

    // Create level
    const level = await prisma.level.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, level }, { status: 201 });
  } catch (error) {
    console.error("Error creating level:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// c6ee6ba1-05a2-49b8-9cce-2b70b9682e77

// 8d0c42e1-929b-4a1c-a3c2-d001b93ae43c

// 9e3c6858-a4bc-4316-9008-82a1269a9f45
