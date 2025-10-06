import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      select: { sectionTeacherOf: { select: { id: true } } },
    });

    if (!teacher?.sectionTeacherOf) {
      return NextResponse.json({ error: "You are not assigned as a class/section teacher" }, { status: 403 });
    }

    const { studentId, date, status } = await req.json() as {
      studentId: string;
      date: string;
      status: "PRESENT" | "ABSENT" | "HALFDAY";
    };

    const attendanceDate = new Date(date);

    // ✅ Validate student belongs to teacher's section
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true },
    });

    if (!student || student.sectionId !== teacher.sectionTeacherOf.id) {
      return NextResponse.json({ error: "Not allowed to update this student's attendance" }, { status: 403 });
    }

    const updated = await prisma.attendance.update({
      where: { studentId_date: { studentId, date: attendanceDate } },
      data: { status },
    });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (err) {
    console.error("Attendance update error:", err);
    return NextResponse.json({ error: "Failed to update attendance" }, { status: 500 });
  }
}
