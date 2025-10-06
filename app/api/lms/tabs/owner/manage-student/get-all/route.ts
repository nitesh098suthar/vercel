import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Only owner/super_admin should be able to view all students
    if (user.role !== "owner" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const students = await prisma.student.findMany({
      where: {
        class: {
          ownerId: user.id,
        },
      },
      include: {
        class: true,
        section: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, students }, { status: 200 });
  } catch (e) {
    console.error("Error fetching students:", e);
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
