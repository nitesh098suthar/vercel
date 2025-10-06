import { getServerUser } from "@/lib/get-server-session";
import { prisma } from "@/lib/prisma";
import { CreateStudent } from "@/types/student";
import { Gender } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const studentId = formData.get("studentId") as string;

    if (!studentId) {
      return NextResponse.json(
        { error: "studentId is required" },
        { status: 400 }
      );
    }

    // ✅ Find student
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { class: true, section: true },
    });

    if (!existingStudent) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // ✅ Permission checks
    const classData = existingStudent.class;
    if (!classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 });
    }

    if (user.role === "owner") {
      if (user.id !== classData.ownerId) {
        return NextResponse.json(
          { error: "Forbidden: Not your class" },
          { status: 403 }
        );
      }
    } else if (user.role === "teacher") {
      const teacher = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: { ownerId: true },
      });

      if (!teacher || teacher.ownerId !== classData.ownerId) {
        return NextResponse.json(
          { error: "Forbidden: Not your owner’s class" },
          { status: 403 }
        );
      }
    } else {
      return NextResponse.json({ error: "Forbidden: Role not allowed" }, { status: 403 });
    }

    // ✅ Collect updates
    const updateData:CreateStudent = {};
    if (formData.has("name")) updateData.name = formData.get("name") as string;
    if (formData.has("dateOfBirth")) updateData.dateOfBirth = formData.get("dateOfBirth") as string;
    if (formData.has("fatherName")) updateData.fatherName = formData.get("fatherName") as string;
    if (formData.has("motherName")) updateData.motherName = formData.get("motherName") as string;
    if (formData.has("guardianPhone")) updateData.guardianPhone = formData.get("guardianPhone") as string;
    if (formData.has("address")) updateData.address = formData.get("address") as string;
    if (formData.has("gender")) updateData.gender = formData.get("gender") as Gender;
    if (formData.has("rollNumber")) updateData.rollNumber = parseInt(formData.get("rollNumber") as string);
    if (formData.has("password")) updateData.password = formData.get("password") as string;

    const profilePhotoFile = formData.get("profilePhoto") as File | null;
    if (profilePhotoFile) {
      updateData.profilePhoto = `/uploads/${profilePhotoFile.name}`;
    }

    // ✅ Update student
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({ success: true, student: updatedStudent });
  } catch (error) {
    console.error("Update Student Error:", error);
    return NextResponse.json(
      { error: "Failed to update student", details: error },
      { status: 500 }
    );
  }
}
