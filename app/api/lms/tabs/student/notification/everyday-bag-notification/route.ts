import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { pushToken, studentId } = await req.json();

    if (!pushToken || !studentId) {
      return NextResponse.json(
        { error: "pushToken and studentId are required" },
        { status: 400 }
      );
    }

    await prisma.student.update({
      where: { id: studentId },
      data: { pushToken },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving push token:", error);
    return NextResponse.json(
      { error: "Failed to save token" },
      { status: 500 }
    );
  }
}
