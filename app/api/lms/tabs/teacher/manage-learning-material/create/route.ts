import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { randomUUID } from "crypto";
import { getServerUser } from "@/lib/get-server-session";
import sharp from "sharp";

const MAX_BUNDLE_SIZE = 120 * 1024 * 1024; // 120MB
const ALLOWED_MIME = new Set([
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",

  // Images (mobile-friendly)
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
    if (user.role !== "teacher")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const classId = formData.get("classId") as string;
    const sectionId = formData.get("sectionId") as string;
    const subjectId = formData.get("subjectId") as string;

    if (!title || !classId || !sectionId || !subjectId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const files = formData.getAll("files") as File[];

    // Validate total size
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_BUNDLE_SIZE) {
      return NextResponse.json({ error: "Bundle exceeds 120MB limit" }, { status: 400 });
    }

    // Create main record
    const material = await prisma.learningMaterial.create({
      data: {
        title,
        description,
        teacherId: user.id,
        classId,
        sectionId,
        subjectId,
      },
    });

    const uploadedFiles = [];

    for (const file of files) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer as ArrayBuffer);

      let finalBuffer:Buffer = buffer;
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

      const key = `learning-materials/${user.id}/${randomUUID()}-${file.name
        .replace(/\s+/g, "-")
        .toLowerCase()}.${ext}`;

      const url = await uploadToS3({
        key,
        body: finalBuffer,
        contentType,
      });

      const savedFile = await prisma.learningMaterialFile.create({
        data: {
          url,
          fileName: file.name,
          fileType: contentType,
          fileSize: file.size,
          materialId: material.id,
        },
      });

      uploadedFiles.push(savedFile);
    }

    return NextResponse.json({ material, files: uploadedFiles }, { status: 201 });
  } catch (err) {
    console.error("Learning material creation failed:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
