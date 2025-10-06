import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    if (user.role !== "student")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // ✅ studentId is directly from logged-in user
    const studentId = user.id;

    const reports = await prisma.progressReport.findMany({
      where: {
        studentId,
      },
      include: {
        teacher: {
          select: { id: true, name: true, email: true },
        },
        class: true,
        section: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!reports.length) {
      return NextResponse.json(
        { message: "No reports found for you" },
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
