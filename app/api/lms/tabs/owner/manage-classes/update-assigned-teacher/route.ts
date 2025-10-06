import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 👇 Get values from query params
    const searchParams = req.nextUrl.searchParams;
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const newTeacherId = searchParams.get("teacherId");

    if (!classId || !sectionId || !newTeacherId) {
      return NextResponse.json(
        { error: "classId, sectionId and teacherId are required" },
        { status: 400 }
      );
    }

    // ✅ Check class belongs to owner
    const classObj = await prisma.class.findUnique({
      where: { id: classId, ownerId: user.id },
      select: { id: true },
    });

    if (!classObj) {
      return NextResponse.json(
        { error: "Class not found or does not belong to you" },
        { status: 404 }
      );
    }

    // ✅ Check section belongs to that class
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, classId: true },
    });

    if (!section || section.classId !== classId) {
      return NextResponse.json(
        { error: "Section not found in the given class" },
        { status: 404 }
      );
    }

    // ✅ Check new teacher belongs to the same owner
    const teacher = await prisma.teacher.findUnique({
      where: { id: newTeacherId, ownerId: user.id },
      select: { id: true },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Teacher not found or does not belong to you" },
        { status: 404 }
      );
    }

    // ✅ Update classTeacher for section
    const updatedSection = await prisma.section.update({
      where: { id: sectionId },
      data: {
        classTeacher: {
          connect: { id: newTeacherId }, // overwrite with new teacher
        },
      },
      include: {
        classTeacher: {
          select: { id: true, name: true, phoneNumber: true, email: true },
        },
        class: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Class teacher updated successfully",
      section: updatedSection,
    });
  } catch (error) {
    console.error("Error updating class teacher:", error);
    return NextResponse.json(
      { error: "Failed to update class teacher" },
      { status: 500 }
    );
  }
}
