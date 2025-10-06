// app/api/lms/tabs/owner/manage-subject/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner" && user.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { subjectId } = (await req.json()) as { subjectId: string };

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    // ensure subject belongs to this owner
    const subject = await prisma.subject.findFirst({
      where: { id: subjectId, class: { ownerId: user.id } },
    });

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found or not owned by you" },
        { status: 404 }
      );
    }

    // ✅ Delete dependencies first
    await prisma.subjectTeacher.deleteMany({ where: { subjectId } });
    await prisma.schedule.deleteMany({ where: { subjectId } });
    await prisma.assignment.deleteMany({ where: { subjectId } });
    await prisma.learningMaterial.deleteMany({ where: { subjectId } });

    // ✅ Now delete subject
    await prisma.subject.delete({ where: { id: subjectId } });

    return NextResponse.json({
      success: true,
      message: "Subject deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subject Error:", error);
    return NextResponse.json(
      { error: "Failed to delete subject" },
      { status: 500 }
    );
  }
}
