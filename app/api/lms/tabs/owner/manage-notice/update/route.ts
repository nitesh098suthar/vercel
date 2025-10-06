import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { getServerUser } from "@/lib/get-server-session";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";
import sharp from "sharp";

const ALLOWED_MIME = new Set([
  // documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc

  // images (mobile-friendly)
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function safeRecipient(
  val: string | null
): "TEACHERS" | "STUDENTS" | "BOTH" | null {
  if (!val) return null;
  if (val === "TEACHERS" || val === "STUDENTS" || val === "BOTH") return val;
  throw new Error("Invalid recipient. Must be TEACHERS, STUDENTS or BOTH.");
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const noticeId = formData.get("noticeId")?.toString();
    if (!noticeId)
      return NextResponse.json(
        { error: "Notice ID is required" },
        { status: 400 }
      );

    const existing = await prisma.notice.findUnique({
      where: { id: noticeId },
    });
    if (!existing || existing.ownerId !== user.id) {
      return NextResponse.json(
        { error: "Notice not found or not yours" },
        { status: 404 }
      );
    }

    const title = formData.get("title")?.toString() ?? null;
    const message = formData.get("message")?.toString() ?? null;
    const recipient = safeRecipient(
      formData.get("recipient")?.toString() ?? null
    );

    let fileUrl: string | null = existing.fileUrl;
    const file = formData.get("file") as File | null;
    const removeFile = formData.get("removeFile") === "true"; // allow explicit file removal

    if (file && file.size > 0) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      const MAX_BYTES = 15 * 1024 * 1024;
      if (file.size > MAX_BYTES) {
        return NextResponse.json(
          { error: "File too large (max 15MB)" },
          { status: 413 }
        );
      }

      // Delete old file if it exists
      if (existing.fileUrl) {
        try {
          const key = getKeyFromS3Url(existing.fileUrl);
          await deleteFromS3(key);
        } catch (err) {
          console.error("Failed to delete old notice file from S3:", err);
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      let finalBuffer: Buffer = buffer;
      let ext: string;
      let contentType: string;

      if (file.type.startsWith("image/")) {
        // Convert all images to JPEG for universal compatibility
        finalBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        ext = "jpg";
        contentType = "image/jpeg";
      } else if (file.type === "application/pdf") {
        ext = "pdf";
        contentType = "application/pdf";
      } else if (file.type === "application/msword") {
        ext = "doc";
        contentType = "application/msword";
      } else if (
        file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        ext = "docx";
        contentType =
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      } else {
        ext = "bin";
        contentType = "application/octet-stream";
      }

      const slug = (title ?? "notice")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);

      const key = `notices/${user.id}/${Date.now()}-${slug}.${ext}`;

      fileUrl = await uploadToS3({
        key,
        contentType,
        body: finalBuffer,
        publicRead: true,
      });
    } else if (removeFile && existing.fileUrl) {
      try {
        const key = getKeyFromS3Url(existing.fileUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete notice file from S3:", err);
      }
      fileUrl = null;
    }

    const updatedNotice = await prisma.notice.updateMany({
      where: { id: noticeId, ownerId: user.id },
      data: {
        ...(title !== null ? { title } : {}),
        ...(message !== null ? { message } : {}),
        ...(recipient !== null ? { recipient } : {}),
        fileUrl,
      },
    });

    if (updatedNotice.count === 0) {
      return NextResponse.json(
        { error: "Notice not found or not yours" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Notice updated successfully",
    });
  } catch (err) {
    console.error("Update Notice error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
