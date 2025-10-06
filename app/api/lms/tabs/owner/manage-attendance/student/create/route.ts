import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ✅ Only owner can mark student attendance
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, classId, sectionId, records } = (await req.json()) as {
      date: string; // "2025-08-26"
      classId: string;
      sectionId: string;
      records: {
        studentId: string;
        status: "PRESENT" | "ABSENT" | "HALFDAY";
      }[];
    };

    const attendanceDate = new Date(date);

    // ✅ Verify that the class belongs to the logged-in owner
    const classObj = await prisma.class.findFirst({
      where: { id: classId, ownerId: user.id },
    });

    if (!classObj) {
      return NextResponse.json(
        { error: "Class does not belong to this owner" },
        { status: 403 }
      );
    }

    // ✅ Verify section belongs to this class
    const sectionObj = await prisma.section.findFirst({
      where: { id: sectionId, classId },
    });

    if (!sectionObj) {
      return NextResponse.json(
        { error: "Section does not belong to this class" },
        { status: 403 }
      );
    }

    // ✅ Verify all students belong to the given class & section
    const studentIds = records.map((r) => r.studentId);

    const validStudents = await prisma.student.findMany({
      where: {
        id: { in: studentIds },
        classId,
        sectionId,
      },
      select: { id: true },
    });

    const validStudentIds = validStudents.map((s) => s.id);
    const invalidIds = studentIds.filter((id) => !validStudentIds.includes(id));

    if (invalidIds.length > 0) {
      return NextResponse.json(
        {
          error: "Some students do not belong to this class/section",
          invalidIds,
        },
        { status: 400 }
      );
    }

    // ✅ Upsert attendance for each valid student
    const results = await Promise.all(
      records.map((r) =>
        prisma.attendance.upsert({
          where: {
            studentId_date: { studentId: r.studentId, date: attendanceDate },
          },
          update: { status: r.status },
          create: {
            studentId: r.studentId,
            date: attendanceDate,
            status: r.status,
          },
        })
      )
    );

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (err) {
    console.error("Student Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to mark attendance" },
      { status: 500 }
    );
  }
}
