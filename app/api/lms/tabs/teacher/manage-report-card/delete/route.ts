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
    const reportId = searchParams.get("id");

    if (!reportId) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    const existing = await prisma.progressReport.findUnique({ where: { id: reportId } });
    if (!existing || existing.teacherId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // Delete file from S3 if exists
    if (existing.attachmentUrl) {
      try {
        const key = getKeyFromS3Url(existing.attachmentUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete report file from S3:", err);
      }
    }

    await prisma.progressReport.delete({ where: { id: reportId } });

    return NextResponse.json({ message: "Progress report deleted successfully" }, { status: 200 });
  } catch (err) {
    console.error("Progress report delete failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
