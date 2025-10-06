// app/api/items/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";

// S3 client config
const s3 = new S3Client({
  region: process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AMPLIFY_AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AMPLIFY_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // 1️⃣ Get the item including images
    const item = await prisma.item.findUnique({
      where: { id },
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // 2️⃣ Extract S3 keys from URLs and delete them
    const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET!;
    const region = process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION!;

    const s3BaseUrl = `https://${Bucket}.s3.${region}.amazonaws.com/`;

    const deletePromises = item.images.map((url) => {
      const Key = url.replace(s3BaseUrl, "");
      return s3.send(new DeleteObjectCommand({ Bucket, Key }));
    });

    await Promise.all(deletePromises);

    // 3️⃣ Delete the item from the database
    await prisma.item.delete({ where: { id } });

    return NextResponse.json({
      success: true,
      message: "Item and images deleted",
    });
  } catch (error) {
    console.error("❌ Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 }
    );
  }
}
