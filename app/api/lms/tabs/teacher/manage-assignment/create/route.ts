// teacher/manage-assignments/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { getServerUser } from "@/lib/get-server-session";
import sharp from "sharp";

const ALLOWED_MIME = new Set([
  // documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  // images
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
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string | null;
    const dueDate = formData.get("dueDate") as string; // "2025-09-30"
    const sectionId = formData.get("sectionId") as string;
    const classId = formData.get("classId") as string;
    const subjectId = formData.get("subjectId") as string;

    if (!title || !sectionId || !classId || !subjectId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Handle file upload if provided
    let fileUrl: string | null = null;
    const file = formData.get("file") as File | null;

    if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      let buffer : Buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      let ext: string;
      let contentType: string;

      if (file.type.startsWith("image/")) {
        // Convert images to JPEG for universal compatibility
        buffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
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

      const key = `assignments/${user.id}/${randomUUID()}-${file.name
        .replace(/\s+/g, "-")
        .toLowerCase()}.${ext}`;

      fileUrl = await uploadToS3({
        key,
        body: buffer,
        contentType,
      });
    }

    // Save assignment in DB
    const assignment = await prisma.assignment.create({
      data: {
        title,
        description,
        dueDate: new Date(dueDate),
        fileUrl,
        teacherId: user.id,
        sectionId,
        classId,
        subjectId,
      },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err) {
    console.error("Assignment creation failed:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
