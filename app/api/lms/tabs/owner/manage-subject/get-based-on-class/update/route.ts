import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId, classId, name, teacherIds } = await req.json() as {
      subjectId: string;
      classId: string;
      name?: string;
      teacherIds?: string[];
    };

    if (!subjectId || !classId) {
      return NextResponse.json({ error: "subjectId and classId are required" }, { status: 400 });
    }

    // permission check
    let ownerId: string | null = null;

    if (user.role === "owner") {
      ownerId = user.id;
    } else if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { ownerId: true },
      });
      if (!teacher) return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
      ownerId = teacher.ownerId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // check class ownership
    const klass = await prisma.class.findFirst({
      where: { id: classId, ownerId },
    });
    if (!klass) {
      return NextResponse.json({ error: "Class not found or not owned by you" }, { status: 404 });
    }

    // ensure subject belongs to this class
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, classId },
    });
    if (!subject) {
      return NextResponse.json({ error: "Subject not found in this class" }, { status: 404 });
    }

    // update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        ...(name ? { name } : {}),
        ...(teacherIds
          ? {
              teachers: {
                deleteMany: {}, // clear old teacher assignments
                create: teacherIds.map((tid) => ({
                  teacher: { connect: { id: tid } },
                })),
              },
            }
          : {}),
      },
      include: {
        teachers: { include: { teacher: true } },
      },
    });

    return NextResponse.json({ success: true, subject: updatedSubject });
  } catch (e) {
    console.error("Update subject error:", e);
    return NextResponse.json({ error: "Failed to update subject" }, { status: 500 });
  }
}
