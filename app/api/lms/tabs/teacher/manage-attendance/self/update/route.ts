// PATCH /api/teacher-attendance/self
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only teacher can access this API
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { date, status } = (await req.json()) as {
      date: string; // e.g. "2025-09-05"
      status: "PRESENT" | "ABSENT" | "HALFDAY";
    };

    const attendanceDate = new Date(date);

    const updated = await prisma.teacherAttendance.update({
      where: { teacherId_date: { teacherId: user.id, date: attendanceDate } },
      data: { status },
    });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (err) {
    console.error("Teacher self-attendance update error:", err);
    return NextResponse.json(
      { error: "Failed to update self attendance" },
      { status: 500 }
    );
  }
}
