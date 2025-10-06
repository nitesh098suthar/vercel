// POST /api/teacher-attendance
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, records } = (await req.json()) as {
      date: string;
      records: {
        teacherId: string;
        status: "PRESENT" | "ABSENT" | "HALFDAY";
        location?: string;
      }[];
    };

    const attendanceDate = new Date(date);
    const teacherIds = records.map((r) => r.teacherId);

    // validate ownership
    const teachers = await prisma.teacher.findMany({
      where: { id: { in: teacherIds }, ownerId: user.id },
      select: { id: true },
    });

    const ownedTeacherIds = teachers.map((t) => t.id);
    const invalidTeachers = teacherIds.filter(
      (id) => !ownedTeacherIds.includes(id)
    );

    if (invalidTeachers.length > 0) {
      return NextResponse.json(
        {
          error:
            "You are not allowed to mark attendance for these teachers",
          invalidTeachers,
        },
        { status: 403 }
      );
    }

    // mark attendance
    const results = await Promise.all(
      records.map((r) =>
        prisma.teacherAttendance.upsert({
          where: {
            teacherId_date: { teacherId: r.teacherId, date: attendanceDate },
          },
          update: {
            status: r.status,
            markedAt: new Date(),
            markedBy: "OWNER",
            location: r.location,
          },
          create: {
            teacherId: r.teacherId,
            date: attendanceDate,
            status: r.status,
            markedAt: new Date(),
            markedBy: "OWNER",
            location: r.location,
          },
        })
      )
    );

    return NextResponse.json({ success: true, results }, { status: 201 });
  } catch (err) {
    console.error("Teacher attendance error:", err);
    return NextResponse.json(
      { error: "Failed to mark teacher attendance" },
      { status: 500 }
    );
  }
}
