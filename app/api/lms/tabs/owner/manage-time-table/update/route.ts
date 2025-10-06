import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { UpdateScheduleData } from "@/types/otherTypes";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { scheduleId, subjectId, teacherId, dayOfWeek, startTime, endTime } =
      (await req.json()) as {
        scheduleId: string;
        subjectId?: string;
        teacherId?: string;
        dayOfWeek?: number;
        startTime?: string;
        endTime?: string;
      };

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      );
    }

    // fetch schedule to check permissions
    const existing = await prisma.schedule.findUnique({
      where: { id: scheduleId },
      include: { class: true },
    });
    if (!existing)
      return NextResponse.json(
        { error: "Schedule not found" },
        { status: 404 }
      );

    if (user.role === "teacher") {
      if (user.id !== existing.teacherId) {
        return NextResponse.json(
          { error: "Teachers can only update their own schedule" },
          { status: 403 }
        );
      }
    } else if (user.role !== "owner" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Build update data
    const updateData: UpdateScheduleData = {};
    if (subjectId) updateData.subjectId = subjectId;
    if (teacherId) updateData.teacherId = teacherId;
    if (typeof dayOfWeek === "number") updateData.dayOfWeek = dayOfWeek;
    if (startTime) updateData.startTime = startTime;
    if (endTime) updateData.endTime = endTime;

    // Conflict checks (only if time/teacher/day changed)
    if (
      (teacherId || startTime || endTime || dayOfWeek) &&
      updateData.teacherId
    ) {
      const clash = await prisma.schedule.findFirst({
        where: {
          id: { not: scheduleId },
          teacherId: updateData.teacherId,
          dayOfWeek: updateData.dayOfWeek ?? existing.dayOfWeek,
          startTime: { lt: updateData.endTime ?? existing.endTime },
          endTime: { gt: updateData.startTime ?? existing.startTime },
        },
      });
      if (clash) {
        return NextResponse.json(
          { error: "Teacher already has a class in this timeslot" },
          { status: 409 }
        );
      }
    }

    const updated = await prisma.schedule.update({
      where: { id: scheduleId },
      data: updateData,
      include: { subject: true, teacher: true, class: true, section: true },
    });

    return NextResponse.json(
      { success: true, schedule: updated },
      { status: 200 }
    );
  } catch (e) {
    console.error("Error updating schedule:", e);
    return NextResponse.json(
      { error: "Failed to update schedule" },
      { status: 500 }
    );
  }
}
