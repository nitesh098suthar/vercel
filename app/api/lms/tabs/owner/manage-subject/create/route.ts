import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner" && user.role !== "super_admin")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { classId, name, teacherIds } = await req.json() as {
      classId: string; name: string; teacherIds?: string[];
    };

    if (!classId || !name)
      return NextResponse.json({ error: "classId and name are required" }, { status: 400 });

    // ensure class belongs to this owner (optional but recommended)
    const klass = await prisma.class.findFirst({ where: { id: classId, ownerId: user.id } });
    if (!klass) return NextResponse.json({ error: "Class not found or not owned by you" }, { status: 404 });

    const subject = await prisma.subject.create({
      data: {
        name,
        classId,
        // if teacherIds provided, create join rows
        ...(teacherIds?.length ? {
          teachers: {
            create: teacherIds.map((tid) => ({ teacher: { connect: { id: tid } } }))
          }
        } : {})
      },
      include: { teachers: { include: { teacher: true } } }
    });

    return NextResponse.json({ success: true, subject }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create subject" }, { status: 500 });
  }
}
