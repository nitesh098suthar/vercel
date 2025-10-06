// teacher/manage-progress-report/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
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

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const classId = formData.get("classId") as string;
    const sectionId = formData.get("sectionId") as string;
    const studentId = formData.get("studentId") as string;
    const reportType = formData.get("reportType") as ReportType;
    const performance = formData.get("performance") as PerformanceType;
    const remark = formData.get("remark") as string | null;
    const grade = formData.get("grade") as GradeType | null;
    const score = formData.get("score") ? parseFloat(formData.get("score") as string) : null;

    if (!classId || !sectionId || !studentId || !reportType || !performance) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ handle optional file upload
    let attachmentUrl: string | null = null;
    const file = formData.get("file") as File | null;

    if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 400 });
      }

      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: "File exceeds 120MB limit" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      let finalBuffer : Buffer = buffer;
      let ext: string;
      let contentType: string;

      if (file.type.startsWith("image/")) {
        // Convert all images to JPEG
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
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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
    }

    // ✅ create progress report entry
    const report = await prisma.progressReport.create({
      data: {
        teacherId: user.id,
        classId,
        sectionId,
        studentId,
        reportType: reportType as ReportType,
        performance: performance as PerformanceType,
        remark,
        grade: grade as GradeType,
        score,
        attachmentUrl,
      },
    });

    return NextResponse.json(
      { message: "Progress report created successfully", report },
      { status: 201 }
    );
  } catch (err) {
    console.error("Progress report creation failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
