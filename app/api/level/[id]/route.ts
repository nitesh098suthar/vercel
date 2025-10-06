
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 🔍 Check if level exists
    const existing = await prisma.level.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ error: "Level not found" }, { status: 404 });
    }

    // ❌ Delete the level
    await prisma.level.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Level deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting level:", error);
    return NextResponse.json(
      { error: "Failed to delete level" },
      { status: 500 }
    );
  }
}
