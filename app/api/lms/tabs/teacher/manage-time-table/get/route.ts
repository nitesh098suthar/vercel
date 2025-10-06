import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ fetch all schedules where this teacher is assigned
    const schedules = await prisma.schedule.findMany({
      where: { teacherId: user.id },
      include: {
        subject: true,
        class: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // format response (easy for frontend)
    const timetable = schedules.map((s) => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek, // 0=Sunday, 1=Monday...
      startTime: s.startTime,
      endTime: s.endTime,
      subjectName: s.subject.name,
      className: s.class.name,
      sectionName: s.section?.name || null,
    }));

    return NextResponse.json({ success: true, timetable }, { status: 200 });
  } catch (e) {
    console.error("Error fetching teacher timetable:", e);
    return NextResponse.json(
      { error: "Failed to fetch teacher timetable" },
      { status: 500 }
    );
  }
}
