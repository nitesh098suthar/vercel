import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subjectId, classId } = await req.json() as {
      subjectId: string;
      classId: string;
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

    // ensure class belongs to this owner
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

    await prisma.subject.delete({ where: { id: subjectId } });

    return NextResponse.json({ success: true, message: "Subject deleted successfully" });
  } catch (e) {
    console.error("Delete subject error:", e);
    return NextResponse.json({ error: "Failed to delete subject" }, { status: 500 });
  }
}
