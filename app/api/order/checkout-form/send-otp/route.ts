import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const authToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
      id: string;
      mobileNumber: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.mobileNumber) {
      return NextResponse.json(
        { message: "User not found or phone missing" },
        { status: 404 }
      );
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verifications.create({
        to: user.mobileNumber,
        channel: "sms",
      });

    return NextResponse.json({
      message: "OTP sent to registered number.",
      sid: verification.sid,
    });
  } catch (error) {
    console.error("SEND OTP ERROR", error);
    return NextResponse.json(
      { message: "Internal server error", error },
      { status: 500 }
    );
  }
}
