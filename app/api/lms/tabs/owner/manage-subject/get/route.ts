// app/api/subjects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let ownerId: string | null = null;

    if (user.role === "owner") {
      ownerId = user.id;
    } else if (user.role === "teacher") {
      // Find teacher and get their ownerId
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

    // fetch all subjects where class.ownerId = ownerId
    const subjects = await prisma.subject.findMany({
      where: {
        class: {
          ownerId: ownerId,
        },
      },
      include: {
        class: true, // show class info
        teachers: {
          include: { teacher: true }, // show assigned teachers
        },
      },
    });

    return NextResponse.json({ success: true, subjects }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subjects:", error);
    return NextResponse.json(
      { error: "Failed to fetch subjects" },
      { status: 500 }
    );
  }
}
