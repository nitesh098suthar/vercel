import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      classId,
      sectionId,
      subjectId,
      teacherId,
      dayOfWeek,
      startTime,
      endTime,
    } = (await req.json()) as {
      classId: string;
      sectionId: string;
      subjectId: string;
      teacherId: string;
      dayOfWeek: number;
      startTime: string;
      endTime: string;
    };

    // Input validations
    if (
      !classId ||
      !subjectId ||
      !teacherId ||
      typeof dayOfWeek !== "number" ||
      !startTime ||
      !endTime
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Ensure subject belongs to class
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, classId },
    });
    if (!subject)
      return NextResponse.json(
        { error: "Subject does not belong to this class" },
        { status: 400 }
      );

    // Ensure section (if given) belongs to class
    if (sectionId) {
      const sec = await prisma.section.findFirst({
        where: { id: sectionId, classId },
      });
      if (!sec)
        return NextResponse.json(
          { error: "Section not in this class" },
          { status: 400 }
        );
    }

    // Authorization:
    // - owner/super_admin: allowed
    // - teacher: only if (teacherId == user.id) AND teacher is assigned to subject
    if (user.role === "teacher") {
      if (user.id !== teacherId) {
        return NextResponse.json(
          { error: "Teachers can only schedule themselves" },
          { status: 403 }
        );
      }
      const assigned = await prisma.subjectTeacher.findFirst({
        where: { subjectId, teacherId: user.id },
      });
      if (!assigned) {
        return NextResponse.json(
          { error: "You are not assigned to this subject" },
          { status: 403 }
        );
      }
    } else if (user.role !== "owner" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Conflict checks
    // 1) Teacher double-booking on same day/time overlap
    const teacherClash = await prisma.schedule.findFirst({
      where: {
        teacherId,
        dayOfWeek,
        // naive overlap check: start < existing.end && end > existing.start
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (teacherClash) {
      return NextResponse.json(
        { error: "Teacher has another class in this timeslot" },
        { status: 409 }
      );
    }

    // 2) Section/class overlap: same class/section at same time
    const sectionFilter = sectionId
      ? { sectionId }
      : { classId, sectionId };
    const classClash = await prisma.schedule.findFirst({
      where: {
        dayOfWeek,
        ...sectionFilter,
        startTime: { lt: endTime },
        endTime: { gt: startTime },
      },
    });
    if (classClash) {
      return NextResponse.json(
        { error: "This class/section already has a period in this timeslot" },
        { status: 409 }
      );
    }

    const schedule = await prisma.schedule.create({
      data: {
        classId,
        sectionId: sectionId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
      },
      include: { subject: true, teacher: true, class: true, section: true },
    });

    return NextResponse.json({ success: true, schedule }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
