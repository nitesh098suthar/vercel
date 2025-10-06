// GET /api/student-attendance?classId=...&sectionId=...&date=YYYY-MM-DD
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ✅ Only owner can fetch student attendance
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const sectionId = searchParams.get("sectionId");
    const date = searchParams.get("date"); // optional

    if (!classId || !sectionId) {
      return NextResponse.json(
        { error: "classId and sectionId are required" },
        { status: 400 }
      );
    }

    // ✅ Verify class belongs to owner
    const classObj = await prisma.class.findFirst({
      where: { id: classId, ownerId: user.id },
    });

    if (!classObj) {
      return NextResponse.json(
        { error: "Class does not belong to this owner" },
        { status: 403 }
      );
    }

    // ✅ Verify section belongs to this class
    const sectionObj = await prisma.section.findFirst({
      where: { id: sectionId, classId },
    });

    if (!sectionObj) {
      return NextResponse.json(
        { error: "Section does not belong to this class" },
        { status: 403 }
      );
    }

    let attendanceRecords;

    if (date) {
      const attendanceDate = new Date(date);

      attendanceRecords = await prisma.attendance.findMany({
        where: {
          student: {
            classId,
            sectionId,
          },
          date: attendanceDate,
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
            },
          },
        },
      });
    } else {
      attendanceRecords = await prisma.attendance.findMany({
        where: {
          student: {
            classId,
            sectionId,
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
              rollNumber: true,
            },
          },
        },
        orderBy: { date: "desc" },
      });
    }

    return NextResponse.json({ success: true, attendance: attendanceRecords });
  } catch (err) {
    console.error("Get Student Attendance Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch attendance" },
      { status: 500 }
    );
  }
}
