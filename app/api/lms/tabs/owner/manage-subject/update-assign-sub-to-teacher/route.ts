import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner" && user.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subjectId, teacherIds } = await req.json() as { subjectId: string; teacherIds: string[] };
    if (!subjectId) return NextResponse.json({ error: "subjectId required" }, { status: 400 });

    // ensure subject belongs to owner
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, class: { ownerId: user.id } },
      include: { class: true }
    });
    if (!subject) return NextResponse.json({ error: "Subject not found or not owned by you" }, { status: 404 });

    // remove all existing assignments for this subject
    await prisma.subjectTeacher.deleteMany({
      where: { subjectId }
    });

    // add new assignments if teacherIds provided
    if (teacherIds?.length) {
      await prisma.subjectTeacher.createMany({
        data: teacherIds.map((teacherId) => ({ subjectId, teacherId })),
        skipDuplicates: true
      });
    }

    // return updated subject with teachers
    const updated = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { teachers: { include: { teacher: true } } }
    });

    return NextResponse.json({ success: true, subject: updated }, { status: 200 });
  } catch (e) {
    console.error("Error updating subject teachers:", e);
    return NextResponse.json({ error: "Failed to update teachers" }, { status: 500 });
  }
}
