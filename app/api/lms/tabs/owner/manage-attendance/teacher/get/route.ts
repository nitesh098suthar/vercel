import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req); // ✅ ensure awaited

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owner can access this API
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // optional ?date=2025-09-05
    const teacherId = searchParams.get("teacherId");

    const where: import("@prisma/client").Prisma.TeacherAttendanceWhereInput = {
      teacher: { ownerId: user.id }, // ✅ restrict to owner’s teachers
    };

    // ✅ If date provided, fetch entire day
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.date = { gte: start, lte: end };
    }

    if (teacherId) {
      // ✅ Verify teacher belongs to owner
      const teacher = await prisma.teacher.findFirst({
        where: { id: teacherId, ownerId: user.id },
        select: { id: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "You are not allowed to view this teacher’s attendance" },
          { status: 403 }
        );
      }

      where.teacherId = teacherId;
    }

    const attendance = await prisma.teacherAttendance.findMany({
      where,
      orderBy: { date: "desc" },
      select: {
        id: true,
        date: true,
        status: true,
        markedAt: true,
        markedBy: true,
        location: true,
        teacher: {
          select: { id: true, name: true, phoneNumber: true, email: true },
        },
      },
    });

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.error("Owner attendance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher attendance" },
      { status: 500 }
    );
  }
}
