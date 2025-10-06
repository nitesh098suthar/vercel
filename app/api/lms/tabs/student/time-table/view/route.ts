// app/api/timetable/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ get class & section of logged-in student
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: { classId: true, sectionId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // ✅ fetch schedules automatically
    const schedules = await prisma.schedule.findMany({
      where: {
        classId: student.classId,
        sectionId: student.sectionId,
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    const timetable = schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek, // 0=Sunday, 1=Monday...
      startTime: s.startTime,
      endTime: s.endTime,
      subjectName: s.subject.name,
      teacherName: s.teacher.name,
      className: s.class.name,
      sectionName: s.section?.name || null,
    }));

    return NextResponse.json({ success: true, timetable }, { status: 200 });
  } catch (e) {
    console.error("Error fetching student timetable:", e);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
