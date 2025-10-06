import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerUser } from "@/lib/get-server-session";

export async function GET(req: NextRequest) {
  try {
    const user = getServerUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let profile = null;

    if (user.role === "owner") {
      profile = await prisma.owner.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          name: true,
          schoolName: true,
          city: true,
          state: true,
          phoneNumber: true,
          email: true,
          schoolLogo: true,
          createdAt: true,
        },
      });
    } else if (user.role === "teacher") {
      profile = await prisma.teacher.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          name: true,
          phoneNumber: true,
          dateOfBirth: true,
          email: true,
          gender: true,
          salary: true,
          experienceYear: true,
          profilePhoto: true,
          address: true,
          createdAt: true,
          owner: {
            select: {
              id: true,
              name: true,
              schoolName: true,
              schoolLogo: true,
            },
          },
        },
      });
    } else if (user.role === "student") {
      profile = await prisma.student.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          role: true,
          name: true,
          rollNumber: true,
          dateOfBirth: true,
          fatherName: true,
          motherName: true,
          guardianPhone: true,
          address: true,
          gender: true,
          profilePhoto: true,
          createdAt: true,
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      });
    }

    if (!profile) {
      return NextResponse.json(
        { message: "User not found or invalid role" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, role: user.role, profile },
      { status: 200 }
    );
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json(
      { message: "Invalid or expired token", error },
      { status: 401 }
    );
  }
}
