import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const scheduleId = searchParams.get("scheduleId");

    if (!scheduleId) {
      return NextResponse.json(
        { error: "scheduleId is required" },
        { status: 400 }
      );
    }

    const schedule = await prisma.schedule.findUnique({
      where: { id: scheduleId },
    });
    if (!schedule)
      return NextResponse.json({ error: "Schedule not found" }, { status: 404 });

    if (user.role === "teacher" && user.id !== schedule.teacherId) {
      return NextResponse.json(
        { error: "Teachers can only delete their own schedules" },
        { status: 403 }
      );
    } else if (user.role !== "owner" && user.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.schedule.delete({ where: { id: scheduleId } });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (e) {
    console.error("Error deleting schedule:", e);
    return NextResponse.json(
      { error: "Failed to delete schedule" },
      { status: 500 }
    );
  }
}
