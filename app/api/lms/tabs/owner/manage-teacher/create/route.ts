// app/api/teachers/route.ts
import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (user.role !== "owner") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await req.formData();

    // Extract data from form-data
    const name = formData.get("name") as string;
    const phoneNumber = formData.get("phoneNumber") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const email = formData.get("email") as string;
    const gender = formData.get("gender") as Gender;
    const salary = formData.get("salary")
      ? parseFloat(formData.get("salary") as string)
      : null;
    const experienceYear = parseInt(formData.get("experienceYear") as string);
    const address = formData.get("address") as string;
    const password = formData.get("password") as string;

    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    let profilePhotoUrl: string | null = null;
    if (profilePhotoFile) {
      profilePhotoUrl = `/uploads/${profilePhotoFile.name}`;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const teacher = await prisma.teacher.create({
      data: {
        name,
        phoneNumber,
        dateOfBirth,
        email,
        gender,
        salary,
        experienceYear,
        address,
        profilePhoto: profilePhotoUrl,
        password: hashedPassword,
        ownerId: user.id,
      },
    });

    return NextResponse.json({ success: true, teacher });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create teacher", details: error },
      { status: 500 }
    );
  }
}
