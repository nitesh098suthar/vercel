import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";

// Protect this route with authToken
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!);
    const userId = (decoded as JwtPayload & { id: string }).id;

    const cartItems = await prisma.cartItem.findMany({
      where: {
        userId,
      },
      include: {
        item: true, // Include full item details (name, price, image, etc.)
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, cartItems });
  } catch (err) {
    console.error("FETCH CART ERROR", err);
    return NextResponse.json(
      { error: "Failed to fetch cart items" },
      { status: 500 }
    );
  }
}
