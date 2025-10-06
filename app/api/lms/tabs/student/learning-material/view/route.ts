import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ensure only student can access this API
    if (user.role !== "student") {
      return NextResponse.json(
        { error: "Only students can access this resource" },
        { status: 403 }
      );
    }

    // Fetch student info using logged-in user.id
    const student = await prisma.student.findUnique({
      where: { id: user.id },
      select: { classId: true, sectionId: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const subjectId = searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { error: "subjectId is required" },
        { status: 400 }
      );
    }

    // Fetch learning materials
    const materials = await prisma.learningMaterial.findMany({
      where: {
        classId: student.classId,
        sectionId: student.sectionId ?? undefined, // if null, don't filter by section
        subjectId,
      },
      include: {
        teacher: { select: { id: true, name: true, email: true } },
        files: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ materials }, { status: 200 });
  } catch (err) {
    console.error("Fetch student materials failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
