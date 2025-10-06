// app/api/owner/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // Parse JSON body
    const { phoneNumber, password } = await req.json();
    console.log("Login attempt with phone:", phoneNumber);
    console.log("Login attempt with password:", password);
    if (!phoneNumber || !password) {
      return NextResponse.json(
        { error: "Phone number and password are required" },
        { status: 400 }
      );
    }

    // ✅ find owner by phone
    const owner = await prisma.owner.findUnique({
      where: { phoneNumber },
    });

    if (!owner) {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }

    // ✅ verify password
    const isPasswordValid = await bcrypt.compare(password, owner.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // ✅ generate JWT token
    const token = jwt.sign(
      {
        id: owner.id,
        role: owner.role,
        phoneNumber: owner.phoneNumber,
      },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" } // token expiry
    );

    // ✅ return response
    return NextResponse.json(
      {
        message: "Login successful",
        owner,
        token,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error in login:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
