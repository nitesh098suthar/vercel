import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const subjectId = searchParams.get("subjectId");

    if (!classId || !sectionId || !subjectId) {
      return NextResponse.json(
        { error: "classId, sectionId, and subjectId are required" },
        { status: 400 }
      );
    }

    // Fetch learning materials with files + teacher info
    const materials = await prisma.learningMaterial.findMany({
      where: {
        classId,
        sectionId,
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
    console.error("Fetch materials failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
