// teacher/manage-learning-material/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { deleteFromS3 } from "@/lib/s3";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";

export async function DELETE(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "teacher") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get("materialId");

    if (!materialId) {
      return NextResponse.json({ error: "Material ID required" }, { status: 400 });
    }

    // Ensure teacher owns this material
    const material = await prisma.learningMaterial.findUnique({
      where: { id: materialId },
      include: { files: true },
    });

    if (!material || material.teacherId !== user.id) {
      return NextResponse.json({ error: "Not found or unauthorized" }, { status: 404 });
    }

    // 🔹 Delete each file from S3
    for (const file of material.files) {
      try {
        const key = getKeyFromS3Url(file.url); // extract "learning-materials/..."
        await deleteFromS3(key);
      } catch (s3Err) {
        console.error(`Failed to delete from S3 (${file.url}):`, s3Err);
      }
    }

    // 🔹 Delete DB file records
    await prisma.learningMaterialFile.deleteMany({
      where: { materialId },
    });

    // 🔹 Delete material
    await prisma.learningMaterial.delete({
      where: { id: materialId },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("Learning material delete failed:", err);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
