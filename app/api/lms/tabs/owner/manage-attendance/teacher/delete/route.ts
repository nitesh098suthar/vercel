import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owners are allowed
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const attendanceId = searchParams.get("attendanceId");

    if (!attendanceId) {
      return NextResponse.json(
        { error: "attendanceId is required" },
        { status: 400 }
      );
    }

    // ✅ Check if attendance exists and belongs to this owner’s teacher
    const attendance = await prisma.teacherAttendance.findUnique({
      where: { id: attendanceId },
      include: { teacher: { select: { ownerId: true } } },
    });

    if (!attendance) {
      return NextResponse.json(
        { error: "Attendance not found" },
        { status: 404 }
      );
    }

    if (attendance.teacher.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not allowed to delete this attendance" },
        { status: 403 }
      );
    }

    await prisma.teacherAttendance.delete({ where: { id: attendanceId } });

    return NextResponse.json({
      success: true,
      message: "Teacher attendance deleted successfully",
    });
  } catch (err) {
    console.error("Delete Teacher Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to delete teacher attendance" },
      { status: 500 }
    );
  }
}
