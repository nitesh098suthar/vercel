import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { studentId } = body;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // ✅ Find student
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ✅ Permission checks
    const classData = existingStudent.class;
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (user.role === "owner") {
      if (user.id !== classData.ownerId) {
        return NextResponse.json(
          { error: "Forbidden: Not your class" },
          { status: 403 }
        );
      }
    } else if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { ownerId: true },
      });

      if (!teacher || teacher.ownerId !== classData.ownerId) {
        return NextResponse.json(
          { error: "Forbidden: Not your owner’s class" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Forbidden: Role not allowed" }, { status: 403 });
    }

    // ✅ Delete student
    await prisma.student.delete({ where: { id: studentId } });

    return NextResponse.json({ success: true, message: "Student deleted successfully" });
  } catch (error) {
    console.error("Delete Student Error:", error);
    return NextResponse.json(
      { error: "Failed to delete student", details: error },
      { status: 500 }
    );
  }
}
