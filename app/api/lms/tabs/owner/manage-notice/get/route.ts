// app/api/notices/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let notices;

    if (user.role === "owner") {
      // Owner sees notices they created
      notices = await prisma.notice.findMany({
        where: { ownerId: user.id },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          message: true,
          fileUrl: true,
          recipient: true,
          createdAt: true,
        },
      });
    } else if (user.role === "teacher") {
      // Teacher sees notices mapped in Notification table
      notices = await prisma.notification.findMany({
        where: { teacherId: user.id },
        orderBy: { notice: { createdAt: "desc" } },
        select: {
          id: true,
          notice: {
            select: {
              id: true,
              title: true,
              message: true,
              fileUrl: true,
              recipient: true,
              createdAt: true,
            },
          },
        },
      });

      // Flatten
      notices = notices.map((n) => ({
        ...n.notice,
      }));
    } else if (user.role === "student") {
      // Student sees notices mapped in Notification table
      notices = await prisma.notification.findMany({
        where: { studentId: user.id },
        orderBy: { notice: { createdAt: "desc" } },
        select: {
          id: true,
          notice: {
            select: {
              id: true,
              title: true,
              message: true,
              fileUrl: true,
              recipient: true,
              createdAt: true,
            },
          },
        },
      });

      // Flatten
      notices = notices.map((n) => ({
        ...n.notice,
      }));
    } else {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }

    return NextResponse.json({ success: true, notices });
  } catch (err) {
    console.error("Fetch Notices error:", err);
    return NextResponse.json(
      { error: err ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
