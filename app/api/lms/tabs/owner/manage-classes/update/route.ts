import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
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

    // ✅ Ensure the class belongs to the logged-in owner
    const existingClass = await prisma.class.findUnique({
      where: { id: classId },
      select: { ownerId: true },
    });

    if (!existingClass) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (existingClass.ownerId !== user.id) {
      return NextResponse.json(
        { error: "You are not allowed to update this class" },
        { status: 403 }
      );
    }

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: { name },
    });

    return NextResponse.json({ success: true, class: updatedClass });
  } catch (error) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      { error: "Failed to update class" },
      { status: 500 }
    );
  }
}
