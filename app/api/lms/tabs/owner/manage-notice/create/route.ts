import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { getServerUser } from "@/lib/get-server-session";
import sharp from "sharp";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_MIME = new Set([
  // documents
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/msword", // .doc

  // images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

function safeRecipient(val: string | null): "TEACHERS" | "STUDENTS" | "BOTH" {
  if (val === "TEACHERS" || val === "STUDENTS" || val === "BOTH") return val;
  throw new Error("Invalid recipient. Must be TEACHERS, STUDENTS or BOTH.");
}

function getExtFromName(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    const title = formData.get("title")?.toString() ?? "";
    const message = formData.get("message")?.toString() || null;
    const recipient = safeRecipient(
      formData.get("recipient")?.toString() ?? null
    );

    if (!title.trim()) {
      return NextResponse.json({ error: "title required" }, { status: 400 });
    }

    const ownerId = user.id;

    // Optional file
    let fileUrl: string | null = null;
    const file = formData.get("file") as File | null;

    if (file && file.size > 0) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: "Only PDF, DOC, DOCX, JPG, PNG, WEBP, HEIC allowed" },
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

      const arrayBuffer = await file.arrayBuffer();
      let buffer: Buffer = Buffer.from(arrayBuffer);

      let ext =
        getExtFromName(file.name) ||
        (file.type === "application/pdf"
          ? "pdf"
          : file.type === "application/msword"
          ? "doc"
          : file.type ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          ? "docx"
          : file.type === "image/png"
          ? "png"
          : "bin");

      let contentType = file.type;

      // 🔄 Convert HEIC/HEIF/WEBP → JPEG
      if (
        file.type === "image/heic" ||
        file.type === "image/heif" ||
        file.type === "image/webp"
      ) {
        buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
        ext = "jpg";
        contentType = "image/jpeg";
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "")
        .slice(0, 60);

      const key = `notices/${ownerId}/${Date.now()}-${slug}.${ext}`;

      fileUrl = await uploadToS3({
        key,
        contentType,
        body: buffer,
        publicRead: true,
      });
    }

    // Create Notice
    const notice = await prisma.notice.create({
      data: { ownerId, title, message, recipient, fileUrl },
      select: { id: true, createdAt: true, recipient: true },
    });

    // Who gets it?
    const wantsStudents = recipient === "STUDENTS" || recipient === "BOTH";
    const wantsTeachers = recipient === "TEACHERS" || recipient === "BOTH";

    const [students, teachers] = await Promise.all([
      wantsStudents
        ? prisma.student.findMany({
            where: { class: { ownerId } },
            select: { id: true },
          })
        : Promise.resolve([]),
      wantsTeachers
        ? prisma.teacher.findMany({
            where: { ownerId },
            select: { id: true },
          })
        : Promise.resolve([]),
    ]);

    const notificationsData = [
      ...students.map((s) => ({
        noticeId: notice.id,
        studentId: s.id,
      })),
      ...teachers.map((t) => ({
        noticeId: notice.id,
        teacherId: t.id,
      })),
    ];

    if (notificationsData.length > 0) {
      await prisma.notification.createMany({ data: notificationsData });
    }

    return NextResponse.json({
      success: true,
      noticeId: notice.id,
      createdAt: notice.createdAt,
      recipients: {
        students: students.length,
        teachers: teachers.length,
      },
      fileUrl,
    });
  } catch (err) {
    console.error("Create Notice error:", err);
    return NextResponse.json(
      { error: err ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
