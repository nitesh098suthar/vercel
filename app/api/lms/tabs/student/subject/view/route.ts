// app/api/student/subjects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Get student info (classId + sectionId)
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: { classId: true, sectionId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch subjects belonging to student's class (and optionally section)
    const subjects = await prisma.subject.findMany({
      where: {
        classId: student.classId,
      },
      include: {
        class: true, // info about class
        teachers: {
          include: { teacher: true }, // assigned teachers
        },
      },
    });

    return NextResponse.json({ success: true, subjects }, { status: 200 });
  } catch (error) {
    console.error("Error fetching student subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
