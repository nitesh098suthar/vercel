import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    await prisma.category.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
