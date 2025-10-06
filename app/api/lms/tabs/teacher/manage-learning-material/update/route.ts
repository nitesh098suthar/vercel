// teacher/manage-learning-material/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";
import { randomUUID } from "crypto";
import { getServerUser } from "@/lib/get-server-session";
import sharp from "sharp";

const MAX_BUNDLE_SIZE = 120 * 1024 * 1024; // 120MB
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
    const materialId = formData.get("materialId") as string;
    const title = formData.get("title") as string | null;
    const description = formData.get("description") as string | null;

    if (!materialId) {
      return NextResponse.json(
        { error: "Material ID required" },
        { status: 400 }
      );
    }

    // Ensure teacher owns this material
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { files: true },
    });

    if (!material || material.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Not found or unauthorized" },
        { status: 404 }
      );
    }

    // Handle removed files
    const removedFileIds = JSON.parse(
      (formData.get("removedFileIds") as string) || "[]"
    ) as string[];
    if (removedFileIds.length > 0) {
      const filesToRemove = await prisma.learningMaterialFile.findMany({
        where: { id: { in: removedFileIds }, materialId },
      });

      for (const file of filesToRemove) {
        try {
          const key = getKeyFromS3Url(file.url);
          await deleteFromS3(key);
        } catch (s3Err) {
          console.error(`Failed to delete from S3 (${file.url}):`, s3Err);
        }
      }

      await prisma.learningMaterialFile.deleteMany({
        where: { id: { in: removedFileIds }, materialId },
      });
    }

    // Handle new file uploads
    const files = formData.getAll("files") as File[];
    const totalSize = files.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > MAX_BUNDLE_SIZE) {
      return NextResponse.json(
        { error: "Bundle exceeds 120MB limit" },
        { status: 400 }
      );
    }

    const updated = await prisma.learningMaterial.update({
      where: { id: materialId },
      data: {
        title: title ?? material.title,
        description: description ?? material.description,
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

      let finalBuffer : Buffer= buffer;
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
          materialId: updated.id,
        },
      });

      uploadedFiles.push(savedFile);
    }

    return NextResponse.json(
      { updated, newFiles: uploadedFiles, removedFileIds },
      { status: 200 }
    );
  } catch (err) {
    console.error("Learning material update failed:", err);
    return NextResponse.json(
      { error: "Failed to update material" },
      { status: 500 }
    );
  }
}
