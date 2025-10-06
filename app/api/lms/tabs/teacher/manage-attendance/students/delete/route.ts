import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
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

    const { studentId, date } = (await req.json()) as { studentId: string; date: string };
    const attendanceDate = new Date(date);

    // ✅ Validate student belongs to teacher's section
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      select: { sectionId: true },
    });

    if (!student || student.sectionId !== teacher.sectionTeacherOf.id) {
      return NextResponse.json({ error: "Not allowed to delete this student's attendance" }, { status: 403 });
    }

    const deleted = await prisma.attendance.delete({
      where: { studentId_date: { studentId, date: attendanceDate } },
    });

    return NextResponse.json({ success: true, deleted }, { status: 200 });
  } catch (err) {
    console.error("Attendance delete error:", err);
    return NextResponse.json({ error: "Failed to delete attendance" }, { status: 500 });
  }
}
