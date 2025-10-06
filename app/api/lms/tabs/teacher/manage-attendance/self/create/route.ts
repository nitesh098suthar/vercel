// POST /api/teacher-attendance/self
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, status, location } = (await req.json()) as {
      date: string;
      status: "PRESENT" | "ABSENT" | "HALFDAY";
      location?: string;
    };

    const attendanceDate = new Date(date);

    const result = await prisma.teacherAttendance.upsert({
      where: {
        teacherId_date: { teacherId: user.id, date: attendanceDate },
      },
      update: {
        status,
        markedAt: new Date(),
        markedBy: "SELF",
        location,
      },
      create: {
        teacherId: user.id,
        date: attendanceDate,
        status,
        markedAt: new Date(),
        markedBy: "SELF",
        location,
      },
    });

    return NextResponse.json({ success: true, result }, { status: 201 });
  } catch (err) {
    console.error("Teacher self-attendance error:", err);
    return NextResponse.json(
      { error: "Failed to mark self attendance" },
      { status: 500 }
    );
  }
}
