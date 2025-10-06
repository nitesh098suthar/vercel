import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const mobile = user.mobileNumber;
    const { otp } = await req.json();

    if (!otp) {
      return NextResponse.json({ error: "OTP is required" }, { status: 400 });
    }

    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({ to: mobile, code: otp });

    if (verification.status !== "approved") {
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP verified" });
  } catch (error) {
    console.error("OTP VERIFY ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong", details: error },
      { status: 500 }
    );
  }
}
