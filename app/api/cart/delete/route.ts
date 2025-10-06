import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authToken = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!);
    const userId = (decoded as JwtPayload & { id: string }).id;

    const { cartItemId } = await req.json();

    if (!cartItemId) {
      return NextResponse.json(
        { error: "Cart item ID is required" },
        { status: 400 }
      );
    }

    // Check if this cart item exists and belongs to the user
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: cartItemId },
    });

    if (!cartItem || cartItem.userId !== userId) {
      return NextResponse.json(
        { error: "Cart item not found or does not belong to user" },
        { status: 404 }
      );
    }

    // Delete cart item
    await prisma.cartItem.delete({
      where: { id: cartItemId },
    });

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (err) {
    console.error("REMOVE FROM CART ERROR", err);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
