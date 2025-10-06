// teacher/manage-assignments/update/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3, deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";
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

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const assignmentId = formData.get("id") as string;
    if (!assignmentId) {
      return NextResponse.json(
        { error: "Missing assignment ID" },
        { status: 400 }
      );
    }

    const existing = await prisma.assignment.findUnique({
      where: { id: assignmentId },
    });
    if (!existing || existing.teacherId !== user.id) {
      return NextResponse.json(
        { error: "Assignment not found or access denied" },
        { status: 404 }
      );
    }

    const title = formData.get("title") as string | undefined;
    const description = formData.get("description") as string | undefined;
    const dueDate = formData.get("dueDate") as string | undefined;
    const sectionId = formData.get("sectionId") as string | undefined;
    const classId = formData.get("classId") as string | undefined;
    const subjectId = formData.get("subjectId") as string | undefined;

    let fileUrl = existing.fileUrl;
    const file = formData.get("file") as File | null;
    const removeFile = formData.get("removeFile") === "true"; // allow clearing file

    if (file) {
      if (!ALLOWED_MIME.has(file.type)) {
        return NextResponse.json(
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
      }

      // Delete old file if exists
      if (existing.fileUrl) {
        try {
          const key = getKeyFromS3Url(existing.fileUrl);
          await deleteFromS3(key);
        } catch (err) {
          console.error("Failed to delete old assignment file from S3:", err);
        }
      }

      let buffer: Buffer = Buffer.from(await file.arrayBuffer());
      let ext: string;
      let contentType: string;

      if (file.type.startsWith("image/")) {
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

      fileUrl = await uploadToS3({ key, body: buffer, contentType });
    } else if (removeFile && existing.fileUrl) {
      try {
        const key = getKeyFromS3Url(existing.fileUrl);
        await deleteFromS3(key);
      } catch (err) {
        console.error("Failed to delete assignment file from S3:", err);
      }
      fileUrl = null;
    }

    const updatedAssignment = await prisma.assignment.update({
      where: { id: assignmentId },
      data: {
        title: title ?? existing.title,
        description: description ?? existing.description,
        dueDate: dueDate ? new Date(dueDate) : existing.dueDate,
        sectionId: sectionId ?? existing.sectionId,
        classId: classId ?? existing.classId,
        subjectId: subjectId ?? existing.subjectId,
        fileUrl,
      },
    });

    return NextResponse.json(
      { success: true, assignment: updatedAssignment },
      { status: 200 }
    );
  } catch (err) {
    console.error("Assignment update failed:", err);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
