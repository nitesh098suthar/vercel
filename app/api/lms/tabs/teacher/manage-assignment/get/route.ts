import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

// ================= GET =================
export async function GET(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // only teacher can view their assignments
    if (user.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const assignments = await prisma.assignment.findMany({
      where: { teacherId: user.id },
      include: {
        class: true,     // get class info
        section: true,   // get section info
        subject: true,   // get subject info
      },
      orderBy: { createdAt: "desc" }, // latest first
    });

    return NextResponse.json({ success: true, assignments }, { status: 200 });
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}
