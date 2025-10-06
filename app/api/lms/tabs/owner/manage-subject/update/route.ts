// app/api/lms/tabs/owner/manage-subject/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner" && user.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subjectId, name, teacherIds } = await req.json() as {
      subjectId: string;
      name?: string;
      teacherIds?: string[];
    };

    if (!subjectId)
      return NextResponse.json({ error: "subjectId is required" }, { status: 400 });

    // find subject with owner check
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        class: { ownerId: user.id },
      },
    });

    if (!subject) {
      return NextResponse.json({ error: "Subject not found or not owned by you" }, { status: 404 });
    }

    // Update subject
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
      include: { teachers: { include: { teacher: true } } },
    });

    return NextResponse.json({ success: true, subject: updatedSubject });
  } catch (error) {
    console.error("Update Subject Error:", error);
    return NextResponse.json(
      { error: "Failed to update subject" },
      { status: 500 }
    );
  }
}
