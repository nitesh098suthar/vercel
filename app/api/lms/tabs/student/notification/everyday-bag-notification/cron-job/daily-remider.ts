import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendNotification(token: string, title: string, body: string) {
  try {
    await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: token,
        sound: "default",
        title,
        body,
        priority: "high",
      }),
    });
  } catch (error) {
    console.error("Notification sending failed:", error);
  }
}

export async function GET() {
  try {
    const students = await prisma.student.findMany({
      where: {
        role: "student", 
        pushToken: { not: null },
      },
      select: {
        pushToken: true,
      },
    });

    for (const student of students) {
      if (student.pushToken) {
        await sendNotification(
          student.pushToken,
          "Reminder 👜",
          "Prepare your bag for the next day!"
        );
      }
    }

    return NextResponse.json({ success: true, count: students.length });
  } catch (error) {
    console.error("Daily reminder error:", error);
    return NextResponse.json(
      { error: "Failed to send notifications" },
      { status: 500 }
    );
  }
}
