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
    const { sectionId } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 }
      );
    }

    // check if section exists and belongs to a class owned by current user
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { class: true },
    });

    if (!section || section.class.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Section not found or not owned by you" },
        { status: 404 }
      );
    }

    // Delete section
    await prisma.section.delete({ where: { id: sectionId } });

    return NextResponse.json(
      { success: true, message: "Section deleted successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Delete Section Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
