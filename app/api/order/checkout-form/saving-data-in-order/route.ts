import { placeOrder } from "@/lib/place-order";
import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const authToken = authHeader.split(" ")[1];
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!) as {
      id: string;
    };

    const userId = decoded.id;
    const body = await req.json();

    const order = await placeOrder({
      ...body,
      userId,
      paymentMethod: "COD",
      paid: false,
    });

    return NextResponse.json(
      { message: "Order created", order },
      { status: 201 }
    );
  } catch (err) {
    console.error("COD Order Error:", err);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
