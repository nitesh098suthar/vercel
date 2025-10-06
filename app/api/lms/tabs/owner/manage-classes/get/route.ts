// app/api/classes/route.ts
import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = getServerUser(req);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ownerId: string | null = null;

    if (session.role === "owner") {
      // ✅ if logged in user is the owner
      ownerId = session.id;
    } else if (session.role === "teacher") {
      // ✅ if logged in user is a teacher, fetch their ownerId
      const teacher = await prisma.teacher.findUnique({
        where: { id: session.id },
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
      // ❌ students or others cannot list all classes
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ✅ Fetch all classes belonging to the resolved ownerId
    const classes = await prisma.class.findMany({
      where: { ownerId },
      include: {
        sections: {
          include: {
            classTeacher: {
              select: {
                id: true,
                name: true,
                phoneNumber: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, classes }, { status: 200 });
  } catch (error) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    );
  }
}
