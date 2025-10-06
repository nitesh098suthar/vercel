import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";
import { uploadToS3 } from "@/lib/s3";

export async function PUT(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();

    let updatedProfile = null;

    // ✅ OWNER update
    if (user.role === "owner") {
      const name = formData.get("name") as string;
      const schoolName = formData.get("schoolName") as string;
      const city = formData.get("city") as string;
      const state = formData.get("state") as string;
      const email = formData.get("email") as string | null;
      const schoolLogoFile = formData.get("schoolLogo") as File | null;

      let schoolLogo: string | undefined;
      if (schoolLogoFile) {
        const buffer = Buffer.from(await schoolLogoFile.arrayBuffer());
        const ext = schoolLogoFile.name.split(".").pop();
        const key = `school-logos/${user.id}-${Date.now()}.${ext}`;
        schoolLogo = await uploadToS3({
          key,
          contentType: schoolLogoFile.type,
          body: buffer,
        });
      }

      updatedProfile = await prisma.owner.update({
        where: { id: user.id },
        data: {
          name,
          schoolName,
          city,
          state,
          email,
          ...(schoolLogo && { schoolLogo }),
        },
      });
    }

    // ✅ TEACHER update
    else if (user.role === "teacher") {
      const name = formData.get("name") as string;
      // const phoneNumber = formData.get("phoneNumber") as string | null;
      const email = formData.get("email") as string;
      const dateOfBirth = formData.get("dateOfBirth") as string;
      const gender = formData.get("gender") as "MALE" | "FEMALE";
      const salary = formData.get("salary")
        ? parseFloat(formData.get("salary") as string)
        : null;
      const experienceYear = formData.get("experienceYear")
        ? parseInt(formData.get("experienceYear") as string)
        : 0;
      const address = formData.get("address") as string;
      const profilePhotoFile = formData.get("profilePhoto") as File | null;

      let profilePhoto: string | undefined;
      if (profilePhotoFile) {
        const buffer = Buffer.from(await profilePhotoFile.arrayBuffer());
        const ext = profilePhotoFile.name.split(".").pop();
        const key = `teacher-profiles/${user.id}-${Date.now()}.${ext}`;
        profilePhoto = await uploadToS3({
          key,
          contentType: profilePhotoFile.type,
          body: buffer,
        });
      }

      updatedProfile = await prisma.teacher.update({
        where: { id: user.id },
        data: {
          name,
          // phoneNumber,
          email,
          dateOfBirth,
          gender,
          salary: salary ?? undefined,
          experienceYear,
          address,
          ...(profilePhoto && { profilePhoto }),
        },
      });
    }

    // ✅ STUDENT update
    else if (user.role === "student") {
      const name = formData.get("name") as string;
      const rollNumber = formData.get("rollNumber")
        ? parseInt(formData.get("rollNumber") as string)
        : null;
      const dateOfBirth = formData.get("dateOfBirth") as string;
      const fatherName = formData.get("fatherName") as string;
      const motherName = formData.get("motherName") as string;
      // const guardianPhone = formData.get("guardianPhone") as string;
      const address = formData.get("address") as string;
      const gender = formData.get("gender") as "MALE" | "FEMALE";
      const profilePhotoFile = formData.get("profilePhoto") as File | null;

      let profilePhoto: string | undefined;
      if (profilePhotoFile) {
        const buffer = Buffer.from(await profilePhotoFile.arrayBuffer());
        const ext = profilePhotoFile.name.split(".").pop();
        const key = `student-profiles/${user.id}-${Date.now()}.${ext}`;
        profilePhoto = await uploadToS3({
          key,
          contentType: profilePhotoFile.type,
          body: buffer,
        });
      }

      updatedProfile = await prisma.student.update({
        where: { id: user.id },
        data: {
          name,
          rollNumber: rollNumber ?? undefined,
          dateOfBirth,
          fatherName,
          motherName,
          address,
          gender,
          ...(profilePhoto && { profilePhoto }),
        },
      });
    }

    return NextResponse.json(
      { success: true, role: user.role, profile: updatedProfile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error },
      { status: 500 }
    );
  }
}
