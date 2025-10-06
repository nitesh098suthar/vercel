import { placeOrder } from "@/lib/place-order";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderDetails,
    } = body;

    const isValid =
      crypto
        .createHmac("sha256", process.env.RAZORPAY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest("hex") === razorpay_signature;

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid signature" },
        { status: 400 }
      );
    }

    console.log(
      "----------------------payment verification-------------------------"
    );
    console.log("orderdetails ", orderDetails);
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authToken = authHeader.split(" ")[1];

    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
      id: string;
      mobileNumber: string;
    };

    console.log("decoded ", decoded);
    console.log("orderDetails :: ", orderDetails);

    const userId = decoded.id;
    console.log("userId ", userId);

    const order = await placeOrder({
      ...orderDetails,
      userId,
      paymentMethod: "ONLINE",
      paid: true,
    });

    return NextResponse.json({
      success: true,
      message: "Payment verified and order placed",
      order,
    });
  } catch (err) {
    console.error("Payment Verification Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
