// 🟡 POST: Create a new category
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      return NextResponse.json(
        { error: "Valid category name is required" },
        { status: 400 }
      );
    }

    // Optional: Check for duplicate category
    const existing = await prisma.category.findUnique({ where: { name } });

    if (existing) {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 }
      );
    }

    const category = await prisma.category.create({
      data: { name: name.trim() },
    });

    return NextResponse.json({ success: true, category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// Pitara aab3b208-40f3-4d0e-9662-774ba5b95773

// Most Popular 921c5508-31eb-4cbc-b587-37f5c55f9a3f

// Loved By Kids 76e97ce3-a6fa-40dc-87cf-56aa784f36ba
