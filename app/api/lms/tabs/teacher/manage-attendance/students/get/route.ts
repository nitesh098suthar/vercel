// GET /api/student-attendance?date=2025-09-05
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      select: {
        sectionTeacherOf: { select: { id: true } },
      },
    });

    if (!teacher?.sectionTeacherOf) {
      return NextResponse.json(
        { error: "You are not assigned as a class or section teacher" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    const where: Record<string, unknown> = {
      student: {
        ...(teacher.sectionTeacherOf && {
          sectionId: teacher.sectionTeacherOf.id,
        }),
      },
    };

    if (date) {
      where.date = new Date(date);
    }

    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNumber: true } },
      },
      orderBy: { date: "desc" },
    });

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.error("Student attendance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch student attendance" },
      { status: 500 }
    );
  }
}
