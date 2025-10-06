import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const teacherId = searchParams.get("teacherId");
    if (!teacherId) {
      return NextResponse.json({ error: "teacherId is required" }, { status: 400 });
    }

    // ensure teacher belongs to this owner
    const existingTeacher = await prisma.teacher.findFirst({
      where: { id: teacherId, ownerId: user.id },
    });
    if (!existingTeacher) {
      return NextResponse.json({ error: "Teacher not found or not owned by you" }, { status: 404 });
    }

    await prisma.teacher.delete({
      where: { id: teacherId },
    });

    return NextResponse.json({ success: true, message: "Teacher deleted successfully" });
  } catch (error) {
    console.error("Error deleting teacher:", error);
    return NextResponse.json({ error: "Failed to delete teacher" }, { status: 500 });
  }
}
