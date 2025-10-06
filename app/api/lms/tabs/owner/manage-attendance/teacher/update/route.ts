// PATCH /api/owner/manage-attendance/teacher/update
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owners are allowed
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

    // ✅ Check if attendance exists and belongs to a teacher under this owner
    const attendance = await prisma.teacherAttendance.findUnique({
      where: { id: attendanceId },
      include: { teacher: { select: { ownerId: true } } },
    });

    if (!attendance) {
      return NextResponse.json({ error: "Attendance not found" }, { status: 404 });
    }

    if (attendance.teacher.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not allowed to update this attendance" },
        { status: 403 }
      );
    }

    const updated = await prisma.teacherAttendance.update({
      where: { id: attendanceId },
      data: { status },
    });

    return NextResponse.json({ success: true, updated });
  } catch (err) {
    console.error("Update Teacher Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to update teacher attendance" },
      { status: 500 }
    );
  }
}
