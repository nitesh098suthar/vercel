// ✅ Sends OTP using Twilio Verify
import { NextResponse } from "next/server";
import twilio from "twilio";

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export async function POST(req: Request) {
  console.log("Twilio SID:", process.env.TWILIO_ACCOUNT_SID);
  console.log(
    "Twilio Auth Token:",
    process.env.TWILIO_AUTH_TOKEN ? "SET" : "MISSING"
  );

  const { name, phone } = await req.json();
  console.log("phont and name :", phone, name);
  if (!phone) {
    return NextResponse.json(
      { error: "Phone number required" },
      { status: 400 }
    );
  }
  if (!name) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  try {
    const verification = await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SERVICE_ID!)
      .verifications.create({
        to: phone,
        channel: "sms",
      });

    return NextResponse.json({ success: true, sid: verification.sid });
  } catch (error) {
    console.error("OTP SEND ERROR", error);
    return NextResponse.json({ error }, { status: 500 });
  }
}
