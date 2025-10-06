// /app/api/user/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { v4 as uuidv4 } from "uuid";
import { getKeyFromS3Url } from "@/lib/get-key-from-s3-url";
import s3 from "@/lib/s3-client";

export async function PATCH(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authToken = authHeader.split(" ")[1];

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
      id: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const alternativeMobile = formData.get("alternativeMobile") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const pincode = formData.get("pincode") as string;
    const fullAddress = formData.get("fullAddress") as string;

    const file = formData.get("profileImage") as File | null;

    let profileImageUrl = user.profileImage;

    if (file && file instanceof File) {
      // Delete old image if exists
      if (user.profileImage) {
        const oldKey = getKeyFromS3Url(user.profileImage);
        const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET as string;
        await s3.send(
          new DeleteObjectCommand({
            Bucket,
            Key: oldKey,
          })
        );
      }

      // Upload new image to S3
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const Bucket = process.env.NEXT_PUBLIC_AMPLIFY_BUCKET as string;
      const fileKey = `profile-images/${uuidv4()}_${file.name}`;

      await s3.send(
        new PutObjectCommand({
          Bucket,
          Key: fileKey,
          Body: buffer,
          ContentType: file.type,
        })
      );

      profileImageUrl = `https://${Bucket}.s3.${process.env.NEXT_PUBLIC_AMPLIFY_AWS_REGION}.amazonaws.com/${fileKey}`;
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name,
        email,
        alternativeMobile,
        city,
        state,
        pincode,
        fullAddress,
        profileImage: profileImageUrl,
      },
    });

    return NextResponse.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("UPDATE USER ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong while updating user" },
      { status: 500 }
    );
  }
}
