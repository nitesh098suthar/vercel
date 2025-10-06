import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";
import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    // Extract data
    const classId = formData.get("classId") as string;
    const sectionId = formData.get("sectionId") as string;
    const name = formData.get("name") as string;
    const dateOfBirth = formData.get("dateOfBirth") as string;
    const fatherName = formData.get("fatherName") as string;
    const motherName = formData.get("motherName") as string;
    const guardianPhone = formData.get("guardianPhone") as string;
    const address = formData.get("address") as string;
    const gender = formData.get("gender") as Gender;
    const rollNumber = parseInt(formData.get("rollNumber") as string);
    const password = formData.get("password") as string;

    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    let profilePhotoUrl: string | null = null;
    if (profilePhotoFile) {
      profilePhotoUrl = `/uploads/${profilePhotoFile.name}`;
    }

    // ================= Permission Checks =================
    const sectionData = await prisma.section.findUnique({
      where: { id: sectionId },
      include: { classTeacher: true, class: true },
    });

    if (!sectionData || sectionData.classId !== classId) {
      return NextResponse.json(
        { error: "Invalid section for this class" },
        { status: 400 }
      );
    }

    const isOwner = user.role === "owner";
    const isClassTeacher = sectionData.classTeacherId === user.id;

    if (sectionData.classTeacherId) {
      if (!isOwner && !isClassTeacher) {
        return NextResponse.json(
          {
            error:
              "Only owner or assigned section class teacher can add student",
          },
          { status: 403 }
        );
      }
    } else {
      if (!isOwner) {
        return NextResponse.json(
          {
            error: "Only owner can add student when class teacher not assigned",
          },
          { status: 403 }
        );
      }
    }

    // ================= Create Student =================
    const student = await prisma.student.create({
      data: {
        name,
        dateOfBirth,
        fatherName,
        motherName,
        guardianPhone,
        address,
        gender,
        rollNumber,
        password, // plain text (as per your schema)
        profilePhoto: profilePhotoUrl,
        classId,
        sectionId,
      },
    });

    return NextResponse.json({ success: true, student });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create student", details: error },
      { status: 500 }
    );
  }
}
