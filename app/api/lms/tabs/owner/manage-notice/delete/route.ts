import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { noticeId } = body;

    if (!noticeId) return NextResponse.json({ error: "Notice ID is required" }, { status: 400 });

    const existing = await prisma.notice.findUnique({ where: { id: noticeId } });
    if (!existing || existing.ownerId !== user.id) {
      return NextResponse.json({ error: "Notice not found or not yours" }, { status: 404 });
    }

    // ✅ Delete related notifications
    await prisma.notification.deleteMany({ where: { noticeId } });

    // ✅ Delete file from S3 if present
    if (existing.fileUrl) {
      try {
        const key = getKeyFromS3Url(existing.fileUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete notice file from S3:", err);
      }
    }

    // ✅ Delete notice from DB
    await prisma.notice.delete({ where: { id: noticeId } });

    return NextResponse.json({ success: true, message: "Notice deleted successfully" });
  } catch (err) {
    console.error("Delete Notice error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
