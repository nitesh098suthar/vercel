// teacher/manage-progress-report/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";
import { randomUUID } from "crypto";
import { getServerUser } from "@/lib/get-server-session";
import sharp from "sharp";
import { GradeType, PerformanceType, ReportType } from "@/types/report-card";

const MAX_FILE_SIZE = 120 * 1024 * 1024; // 120MB
const ALLOWED_MIME = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const reportId = formData.get("id") as string;
    if (!reportId)
      return NextResponse.json(
        { error: "Report ID required" },
        { status: 400 }
      );

    const existing = await prisma.progressReport.findUnique({
      where: { id: reportId },
    });
    if (!existing || existing.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    // Fields
    const classId = formData.get("classId") as string | undefined;
    const sectionId = formData.get("sectionId") as string | undefined;
    const studentId = formData.get("studentId") as string | undefined;
    const reportType = formData.get("reportType") as ReportType | undefined;
    const performance = formData.get("performance") as
      | PerformanceType
      | undefined;
    const remark = formData.get("remark") as string | null;
    const grade = formData.get("grade") as GradeType | null;
    const score = formData.get("score")
      ? parseFloat(formData.get("score") as string)
      : null;

    // Handle file
    let attachmentUrl = existing.attachmentUrl;
    const file = formData.get("file") as File | null;
    const removeAttachment = formData.get("removeAttachment") === "true";

    if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: "File exceeds 120MB limit" },
          { status: 400 }
        );
      }

      // Delete old file if exists
      if (existing.attachmentUrl) {
        try {
          const key = getKeyFromS3Url(existing.attachmentUrl);
          await deleteFromS3(key);
        } catch (err) {
          console.error("Failed to delete old report file from S3:", err);
        }
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      let finalBuffer : Buffer = buffer;
      let ext: string;
      let contentType: string;

      if (file.type.startsWith("image/")) {
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

      const key = `progress-reports/${user.id}/${randomUUID()}-${file.name
        .replace(/\s+/g, "-")
        .toLowerCase()}.${ext}`;

      attachmentUrl = await uploadToS3({
        key,
        body: finalBuffer,
        contentType,
      });
    } else if (removeAttachment && existing.attachmentUrl) {
      try {
        const key = getKeyFromS3Url(existing.attachmentUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete report file from S3:", err);
      }
      attachmentUrl = null;
    }

    const updated = await prisma.progressReport.update({
      where: { id: reportId },
      data: {
        classId: classId ?? existing.classId,
        sectionId: sectionId ?? existing.sectionId,
        studentId: studentId ?? existing.studentId,
        reportType: reportType ?? existing.reportType,
        performance: performance ?? existing.performance,
        remark: remark ?? existing.remark,
        grade: grade ?? existing.grade,
        score: score ?? existing.score,
        attachmentUrl,
      },
    });

    return NextResponse.json(
      { message: "Progress report updated successfully", report: updated },
      { status: 200 }
    );
  } catch (err) {
    console.error("Progress report update failed:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
