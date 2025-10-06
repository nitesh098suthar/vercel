import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get query params
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }

    // Fetch schedules with relations
    const schedules = await prisma.schedule.findMany({
      where: {
        classId,
        ...(sectionId ? { sectionId } : {}),
      },
      include: {
        subject: true,
        teacher: true,
        class: true,
        section: true,
      },
      orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    });

    // Format response (for easier frontend display)
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
    console.error(e);
    return NextResponse.json(
      { error: "Failed to fetch timetable" },
      { status: 500 }
    );
  }
}
