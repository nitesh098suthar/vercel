import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owner can delete student attendance
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const attendanceId = searchParams.get("attendanceId");

    if (!attendanceId) {
      return NextResponse.json({ error: "attendanceId is required" }, { status: 400 });
    }

    // ✅ Check attendance exists and belongs to this owner’s school
    const attendance = await prisma.attendance.findUnique({
      where: { id: attendanceId },
      include: { student: { select: { classId: true } } },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
    }

    const classObj = await prisma.class.findFirst({
      where: { id: attendance.student.classId, ownerId: user.id },
    });

    if (!classObj) {
      return NextResponse.json(
        { error: "You cannot delete attendance of students not in your school" },
        { status: 403 }
      );
    }

    await prisma.attendance.delete({ where: { id: attendanceId } });

    return NextResponse.json({ success: true, message: "Attendance deleted successfully" });
  } catch (err) {
    console.error("Delete Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to delete attendance" },
      { status: 500 }
    );
  }
}
