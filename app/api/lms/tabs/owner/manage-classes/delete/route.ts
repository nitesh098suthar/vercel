import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const user = getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }

    // ✅ Ensure class belongs to this owner
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { ownerId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existingClass.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not allowed to delete this class" },
        { status: 403 }
      );
    }

    await prisma.class.delete({ where: { id: classId } });

    return NextResponse.json({
      success: true,
      message: "Class deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      { error: "Failed to delete class" },
      { status: 500 }
    );
  }
}
