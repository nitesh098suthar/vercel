// app/api/learning-materials/teacher/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check role
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // find all learning materials created by this teacher
    const materials = await prisma.learningMaterial.findMany({
      where: {
        teacherId: user.id, // filter by logged-in teacher
      },
      include: {
        class: true,
        section: true,
        subject: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(materials, { status: 200 });
  } catch (error) {
    console.error("Error fetching teacher materials:", error);
    return NextResponse.json(
      { error: "Failed to fetch learning materials" },
      { status: 500 }
    );
  }
}
