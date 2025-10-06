import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const studentId = req.nextUrl.searchParams.get("studentId");
    if (!studentId) {
      return NextResponse.json(
        { error: "Missing studentId in query params" },
        { status: 400 }
      );
    }

    const reports = await prisma.progressReport.findMany({
      where: {
        teacherId: user.id,
        studentId,
      },
      include: {
        student: true,
        class: true,
        section: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reports.length) {
      return NextResponse.json(
        { message: "No reports found for this student" },
        { status: 404 }
      );
    }

    return NextResponse.json({ reports }, { status: 200 });
  } catch (err) {
    console.error("Error fetching student report cards:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
