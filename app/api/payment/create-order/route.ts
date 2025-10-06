import Razorpay from "razorpay";
import { NextRequest, NextResponse } from "next/server";

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_SECRET!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      amount,
      currency = "INR",
      receipt = "receipt_" + Date.now(),
    } = body;

    // Razorpay expects amount in paise (1 INR = 100 paise)
    const options = {
      amount: amount * 100,
      currency,
      receipt,
      payment_capture: 1,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      currency: order.currency,
      amount: order.amount,
    });
  } catch (error) {
    console.error("Order creation failed", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
