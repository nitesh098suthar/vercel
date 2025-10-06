import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { classId, name } = body;

    if (!classId || !name) {
      return NextResponse.json(
        { error: "classId and name are required" },
        { status: 400 }
      );
    }

    // check if class exists and belongs to current owner
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        ownerId: user.id,
      },
    });

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found or not owned by you" },
        { status: 404 }
      );
    }

    // Create section
    const newSection = await prisma.section.create({
      data: {
        name,
        classId,
      },
    });

    return NextResponse.json(
      { success: true, section: newSection },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
