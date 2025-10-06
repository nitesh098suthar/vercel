// app/api/assignments/student/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ only students can access
    if (user.role !== "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // subjectId is chosen by student in query params
    const subjectId = req.nextUrl.searchParams.get("subjectId");
    if (!subjectId) {
      return NextResponse.json(
        { error: "Missing subjectId in query params" },
        { status: 400 }
      );
    }

    // ✅ fetch the student record to know their class & section
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: { classId: true, sectionId: true },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Student record not found" },
        { status: 404 }
      );
    }

    // ✅ find assignments for that student’s class, section & chosen subject
    const assignments = await prisma.assignment.findMany({
      where: {
        classId: student.classId,
        sectionId: student.sectionId,
        subjectId,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        subject: true,
        class: true,
        section: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!assignments.length) {
      return NextResponse.json(
        { message: "No assignments found for this subject" },
        { status: 404 }
      );
    }

    return NextResponse.json({ assignments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching student assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
