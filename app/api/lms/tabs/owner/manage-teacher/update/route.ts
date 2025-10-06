import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { CreateTeacher } from "@/types/teacher";
import { Gender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { NextResponse, NextRequest } from "next/server";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getServerUser(req);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "owner")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const formData = await req.formData();
    const teacherId = formData.get("teacherId") as string;
    if (!teacherId) {
      return NextResponse.json(
        { error: "teacherId is required" },
        { status: 400 }
      );
    }

    // ensure teacher belongs to this owner
    const existingTeacher = await prisma.teacher.findFirst({
      where: { id: teacherId, ownerId: user.id },
    });
    if (!existingTeacher) {
      return NextResponse.json(
        { error: "Teacher not found or not owned by you" },
        { status: 404 }
      );
    }

    const updateData: CreateTeacher = {};
    if (formData.get("name")) updateData.name = formData.get("name") as string;
    if (formData.get("phoneNumber"))
      updateData.phoneNumber = formData.get("phoneNumber") as string;
    if (formData.get("dateOfBirth"))
      updateData.dateOfBirth = formData.get("dateOfBirth") as string;
    if (formData.get("email"))
      updateData.email = formData.get("email") as string;
    if (formData.get("gender"))
      updateData.gender = formData.get("gender") as Gender;
    if (formData.get("salary"))
      updateData.salary = parseFloat(formData.get("salary") as string);
    if (formData.get("experienceYear"))
      updateData.experienceYear = parseInt(
        formData.get("experienceYear") as string
      );
    if (formData.get("address"))
      updateData.address = formData.get("address") as string;

    if (formData.get("password")) {
      updateData.password = await bcrypt.hash(
        formData.get("password") as string,
        10
      );
    }

    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    if (profilePhotoFile) {
      updateData.profilePhoto = `/uploads/${profilePhotoFile.name}`;
    }

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData,
    });

    return NextResponse.json({ success: true, teacher: updatedTeacher });
  } catch (error) {
    console.error("Error updating teacher:", error);
    return NextResponse.json(
      { error: "Failed to update teacher" },
      { status: 500 }
    );
  }
}
