// app/api/teachers/login/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { phoneNumber, password } = await req.json();

    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // Find teacher by phoneNumber
    const teacher = await prisma.teacher.findUnique({
      where: { phoneNumber },
    });

    if (!teacher) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare hashed password
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: teacher.id,
        role: teacher.role,
        name: teacher.name,
        phoneNumber: teacher.phoneNumber,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      teacher: {
        id: teacher.id,
        name: teacher.name,
        phoneNumber: teacher.phoneNumber,
        email: teacher.email,
        role: teacher.role,
      },
    });
  } catch (error) {
    console.error("Teacher login error:", error);
    return NextResponse.json(
      { error: "Failed to login teacher" },
      { status: 500 }
    );
  }
}
