// GET /api/teacher-attendance/self
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only teachers can access
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date"); // optional: ?date=2025-09-05

    const where: {
      teacherId: string;
      date?: {
        gte: Date;
        lte: Date;
      };
    } = { teacherId: user.id };

    // ✅ If date provided, match entire day range instead of exact timestamp
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setHours(23, 59, 59, 999);

      where.date = {
        gte: start,
        lte: end,
      };
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
          select: { id: true, name: true, email: true }, // include teacher info
        },
      },
    });

    return NextResponse.json(attendance, { status: 200 });
  } catch (error) {
    console.error("Teacher self-attendance fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch self attendance" },
      { status: 500 }
    );
  }
}
