import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    console.log("Fetching sections for user:", user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { error: "classId is required in query params" },
        { status: 400 }
      );
    }

    // check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, ownerId: true },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      );
    }

    // ✅ allow access if:
    // 1. user is owner of the class OR
    // 2. user is a teacher belonging to that owner
    const isOwner = user.id === classExists.ownerId;
    let isTeacher = false;

    if (user.role === "teacher") {
      const teacher = await prisma.teacher.findFirst({
        where: {
          id: user.id, // current logged in teacher
          ownerId: classExists.ownerId, // must belong to the same owner
        },
      });
      isTeacher = !!teacher;
    }

    if (!isOwner && !isTeacher) {
      return NextResponse.json(
        { error: "Not allowed to access this class" },
        { status: 403 }
      );
    }

    // fetch all sections of the class
    const sections = await prisma.section.findMany({
      where: { classId },
      orderBy: { name: "asc" }, // sections in A, B, C order
    });

    return NextResponse.json({ success: true, sections }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
