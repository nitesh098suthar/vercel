import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import twilio from "twilio";
import { prisma } from "@/lib/prisma";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  const { phone, otp, name } = await req.json();

  if (!phone || !otp || !name) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  try {
    const result = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verificationChecks.create({ to: phone, code: otp });

    if (result.status === "approved") {
      // ✅ Check user
      let user = await prisma.user.findUnique({
        where: { mobileNumber: phone },
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            name,
            mobileNumber: phone,
          },
        });
      } else {
        // ✅ Update name
        user = await prisma.user.update({
          where: { mobileNumber: phone },
          data: { name },
        });
      }

      const authToken = jwt.sign(
        { id: user.id, phone: user.mobileNumber },
        process.env.JWT_SECRET!,
        { expiresIn: "365d" }
      );

      return NextResponse.json({ success: true, user, authToken });
    } else {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
    }
  } catch (error) {
    console.error("OTP VERIFY ERROR", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
