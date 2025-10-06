import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

// ✅ GET all reports created by the logged-in teacher
export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const reports = await prisma.progressReport.findMany({
      where: { teacherId: user.id },
      include: {
        student: true,
        class: true,
        section: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ reports }, { status: 200 });
  } catch (err) {
    console.error("Error fetching reports:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
