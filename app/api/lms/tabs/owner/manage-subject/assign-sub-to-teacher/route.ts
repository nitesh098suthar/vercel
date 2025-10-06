import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner" && user.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subjectId, teacherIds } = await req.json() as { subjectId: string; teacherIds: string[] };
    if (!subjectId || !teacherIds?.length)
      return NextResponse.json({ error: "subjectId and teacherIds[] required" }, { status: 400 });

    // ensure subject belongs to owner's class (optional but good)
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, class: { ownerId: user.id } },
      include: { class: true }
    });
    if (!subject) return NextResponse.json({ error: "Subject not found or not owned by you" }, { status: 404 });

    // upsert join rows
    await prisma.subjectTeacher.createMany({
      data: teacherIds.map((teacherId) => ({ subjectId, teacherId })),
      skipDuplicates: true
    });

    const updated = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { teachers: { include: { teacher: true } } }
    });

    return NextResponse.json({ success: true, subject: updated }, { status: 200 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to assign teachers" }, { status: 500 });
  }
}
