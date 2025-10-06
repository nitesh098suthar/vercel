// PATCH /api/owner/manage-attendance/student/update
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owner can update student attendance
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { attendanceId, status } = (await req.json()) as {
      attendanceId: string;
      status: "PRESENT" | "ABSENT" | "HALFDAY";
    };

    if (!attendanceId || !status) {
      return NextResponse.json(
        { error: "attendanceId and status are required" },
        { status: 400 }
      );
    }

    // ✅ Check attendance exists and belongs to a student of this owner
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
        { error: "You cannot update attendance of students not in your school" },
        { status: 403 }
      );
    }

    const updated = await prisma.attendance.update({
      where: { id: attendanceId },
      data: { status },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Update Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to update attendance" },
      { status: 500 }
    );
  }
}
