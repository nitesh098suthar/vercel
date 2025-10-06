// teacher/manage-assignment/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const assignmentId = searchParams.get("id");

    if (!assignmentId) {
      return NextResponse.json({ error: "Missing assignment ID" }, { status: 400 });
    }

    // Ensure teacher owns this assignment
    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });

    if (!existing || existing.teacherId !== user.id) {
      return NextResponse.json({ error: "Assignment not found or access denied" }, { status: 404 });
    }

    // Delete file from S3 if exists
    if (existing.fileUrl) {
      try {
        const key = getKeyFromS3Url(existing.fileUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete assignment file from S3:", err);
      }
    }

    await prisma.assignment.delete({ where: { id: assignmentId } });

    return NextResponse.json({ success: true, message: "Assignment deleted" }, { status: 200 });
  } catch (err) {
    console.error("Assignment deletion failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
