import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    console.log("Fetching teacher for user:", user);

    // Check if user is authenticated and has the role of teacher
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    // Find teacher in DB
    const teacher = await prisma.teacher.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        name: true,
        phoneNumber: true,
        email: true,
        role: true,
        gender: true,
        dateOfBirth: true,
        profilePhoto: true,
      },
    });

    if (!teacher) {
      return NextResponse.json({ error: "Teacher not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, teacher }, { status: 200 });
  } catch (error) {
    console.error("Teacher GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch teacher" },
      { status: 500 }
    );
  }
}
