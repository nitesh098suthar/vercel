import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function POST(req: Request) {
  try {
    const { guardianPhone, password } = await req.json();

    if (!guardianPhone || !password) {
      return NextResponse.json(
        { error: "Guardian phone number and password are required" },
        { status: 400 }
      );
    }

    // Find student by guardianPhone
    const student = await prisma.student.findUnique({
      where: { guardianPhone },
    });

    if (!student) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Compare plain-text password (schema has plain text password)
    if (student.password !== password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = jwt.sign(
      {
        id: student.id,
        role: student.role,
        name: student.name,
        guardianPhone: student.guardianPhone,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "24h" }
    );

    return NextResponse.json({
      message: "Login successful",
      token,
      student: {
        id: student.id,
        name: student.name,
        guardianPhone: student.guardianPhone,
        role: student.role,
        classId: student.classId,
        sectionId: student.sectionId,
      },
    });
  } catch (error) {
    console.error("Student login error:", error);
    return NextResponse.json(
      { error: "Failed to login student" },
      { status: 500 }
    );
  }
}
