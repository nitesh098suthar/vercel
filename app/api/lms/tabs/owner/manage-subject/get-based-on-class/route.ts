import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required" },
        { status: 400 }
      );
    }

    let ownerId: string | null = null;

    if (user.role === "owner") {
      ownerId = user.id;
    } else if (user.role === "teacher") {
      // fetch teacher -> get ownerId
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { ownerId: true },
      });

      if (!teacher) {
        return NextResponse.json(
          { error: "Teacher not found" },
          { status: 404 }
        );
      }

      ownerId = teacher.ownerId;
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ensure class belongs to this owner
    const klass = await prisma.class.findFirst({
      where: { id: classId, ownerId },
    });

    if (!klass) {
      return NextResponse.json(
        { error: "Class not found or not owned by you" },
        { status: 404 }
      );
    }

    // fetch subjects
    const subjects = await prisma.subject.findMany({
      where: { classId },
      include: {
        teachers: {
          include: { teacher: true },
        },
      },
    });

    return NextResponse.json({ success: true, subjects }, { status: 200 });
  } catch (e) {
    console.error("Error fetching subjects:", e);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
