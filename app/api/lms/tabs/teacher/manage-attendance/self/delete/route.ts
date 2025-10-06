// DELETE /api/teacher-attendance/self
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only teacher can access this API
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");

    if (!date) {
      return NextResponse.json(
        { error: "Date is required to delete attendance" },
        { status: 400 }
      );
    }

    const attendanceDate = new Date(date);

    await prisma.teacherAttendance.delete({
      where: { teacherId_date: { teacherId: user.id, date: attendanceDate } },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Teacher self-attendance delete error:", err);
    return NextResponse.json(
      { error: "Failed to delete self attendance" },
      { status: 500 }
    );
  }
}
