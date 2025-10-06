import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/get-server-session"; // assuming you have this

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "classId is required" },
        { status: 400 }
      );
    }

    // fetch class with ownerId
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      select: { ownerId: true },
    });

    if (!classInfo) {
      return NextResponse.json(
        { success: false, message: "Class not found" },
        { status: 404 }
      );
    }

    // permission check
    if (user.role === "owner") {
      if (user.id !== classInfo.ownerId) {
        return NextResponse.json(
          { success: false, message: "Forbidden: Not your class" },
          { status: 403 }
        );
      }
    } else if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { ownerId: true },
      });

      if (!teacher || teacher.ownerId !== classInfo.ownerId) {
        return NextResponse.json(
          { success: false, message: "Forbidden: Not your owner’s class" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json(
        { success: false, message: "Forbidden: Role not allowed" },
        { status: 403 }
      );
    }

    // fetch students
    const students = await prisma.student.findMany({
      where: {
        classId,
        ...(sectionId ? { sectionId } : {}), // filter section if provided
      },
      orderBy: { rollNumber: "asc" },
      select: {
        id: true,
        name: true,
        rollNumber: true,
        gender: true,
        guardianPhone: true,
        profilePhoto: true,
        section: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({ success: true, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
