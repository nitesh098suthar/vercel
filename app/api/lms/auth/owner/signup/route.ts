// app/api/owner/signup/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";

export async function POST(req: Request) {
  try {
    // 👇 parse form-data
    const formData = await req.formData();

    const name = formData.get("name") as string;
    const schoolName = formData.get("schoolName") as string;
    const city = formData.get("city") as string;
    const state = formData.get("state") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const email = formData.get("email") as string | null;
    const password = formData.get("password") as string;
    const schoolLogoFile = formData.get("schoolLogo") as File | null;

    // ✅ validate required fields
    if (!name || !schoolName || !city || !state || !phoneNumber || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ✅ check duplicate phone
    const existingOwnerByPhone = await prisma.owner.findUnique({
      where: { phoneNumber },
    });
    if (existingOwnerByPhone) {
      return NextResponse.json(
        { error: "Phone number already exists" },
        { status: 400 }
      );
    }

    // ✅ check duplicate email only if provided
    if (email) {
      const existingOwnerByEmail = await prisma.owner.findFirst({
        where: { email },
      });
      if (existingOwnerByEmail) {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
    }

    // ✅ hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // ✅ handle logo upload to S3
    let schoolLogo: string | null = null;
    if (schoolLogoFile) {
      const arrayBuffer = await schoolLogoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const fileExt = schoolLogoFile.name.split(".").pop();
      const key = `school-logos/${phoneNumber}-${Date.now()}.${fileExt}`;

      schoolLogo = await uploadToS3({
        key,
        contentType: schoolLogoFile.type,
        body: buffer,
      });
    }

    // ✅ save in DB
    const owner = await prisma.owner.create({
      data: {
        name,
        schoolName,
        city,
        state,
        phoneNumber,
        email,
        passwordHash,
        schoolLogo,
      },
    });

    // ✅ generate JWT
    const token = jwt.sign(
      {
        id: owner.id,
        role: owner.role,
        phoneNumber: owner.phoneNumber,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "1d" }
    );

    return NextResponse.json(
      {
        message: "Owner registered successfully",
        owner,
        token,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in signup:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
