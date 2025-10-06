// POST /api/student-attendance
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only teachers can mark attendance
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Fetch teacher with their class & section teacher assignment
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        sectionTeacherOf: { select: { id: true } }, // section teacher role
      },
    });

    if (!teacher ||  !teacher.sectionTeacherOf) {
      return NextResponse.json(
        { error: "You are not assigned as a class or section teacher" },
        { status: 403 }
      );
    }

    const { date, records } = (await req.json()) as {
      date: string;
      records: { studentId: string; status: "PRESENT" | "ABSENT" | "HALFDAY" }[];
    };

    const attendanceDate = new Date(date);

    // ✅ Validate that students belong to the teacher's class-section
    const studentIds = records.map((r) => r.studentId);
    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        ...(teacher.sectionTeacherOf && { sectionId: teacher.sectionTeacherOf.id }),
      },
      select: { id: true },
    });

    const validStudentIds = validStudents.map((s) => s.id);
    const invalidStudents = studentIds.filter((id) => !validStudentIds.includes(id));

    if (invalidStudents.length > 0) {
      return NextResponse.json(
        { error: "Not allowed to mark attendance for these students", invalidStudents },
        { status: 403 }
      );
    }

    // ✅ Upsert attendance
    const results = await Promise.all(
      records.map((r) =>
        prisma.attendance.upsert({
          where: { studentId_date: { studentId: r.studentId, date: attendanceDate } },
          update: { status: r.status },
          create: { studentId: r.studentId, date: attendanceDate, status: r.status },
        })
      )
    );

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (err) {
    console.error("Student attendance error:", err);
    return NextResponse.json(
      { error: "Failed to mark student attendance" },
      { status: 500 }
    );
  }
}
