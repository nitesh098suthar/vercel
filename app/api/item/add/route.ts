// app/api/items/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import s3 from "@/lib/s3-client";
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const getField = (name: string) => formData.get(name)?.toString() || "";

    // ✅ Regular fields
    const itemCode = getField("itemCode");
    const name = getField("name");
    const description = getField("description");
    const instructions = getField("instructions");
    const price = parseFloat(getField("price"));
    const originalPrice = parseFloat(getField("originalPrice"));
    const numberOfPieces = getField("numberOfPieces");
    const color = getField("color");
    const material = getField("material");
    const recommendedAge = getField("recommendedAge");
    const size = getField("size");
    const weight = getField("weight");
    const itemsInBox = getField("itemsInBox");
    const totalItemsSold = getField("totalItemsSold");
    const brand = getField("brand");
    const manufacturer = getField("manufacturer");
    const countryOfOrigin = getField("countryOfOrigin");
    const rating = getField("rating");
    const totalReviews = getField("totalReviews");

    const isAvailable = getField("isAvailable") === "true";

    // ✅ Comma-separated relation IDs
    const categoryIds = getField("categoryIds")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const tagIds = getField("tagIds")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    const levelIds = getField("levelIds")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    // ✅ Handle image uploads
    const files = formData.getAll("images") as File[];
    const imageUrls: string[] = [];

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileKey = `items/${uuidv4()}_${file.name}`;
      const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET as string;

      const uploadCommand = new PutObjectCommand({
        Bucket,
        Key: fileKey,
        Body: buffer,
        ContentType: file.type,
      });
      await s3.send(uploadCommand);

      const imageUrl = `https://${Bucket}.s3.${process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION}.amazonaws.com/${fileKey}`;
      imageUrls.push(imageUrl);
    }

    // ✅ Create item with many-to-many connections
    const item = await prisma.item.create({
      data: {
        itemCode,
        name,
        description,
        instructions,
        price,
        originalPrice,
        numberOfPieces,
        color,
        material,
        recommendedAge,
        size,
        weight,
        itemsInBox,
        totalItemsSold,
        brand,
        manufacturer,
        countryOfOrigin,
        rating,
        totalReviews,
        isAvailable,
        images: imageUrls,

        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
        tags: {
          connect: tagIds.map((id) => ({ id })),
        },
        levels: {
          connect: levelIds.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json({ success: true, item });
  } catch (error) {
    console.error("❌ Error uploading item:", error);
    return NextResponse.json(
      { error: "Failed to upload item" },
      { status: 500 }
    );
  }
}
