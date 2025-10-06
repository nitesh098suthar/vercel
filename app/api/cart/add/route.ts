import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt, { JwtPayload } from "jsonwebtoken";

// Protect this route with authToken
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  // console.log("authHeader", authHeader);
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authToken = authHeader.split(" ")[1];
  console.log("is authToken available", authToken);
  console.log(process.env.JWT_SECRET!);
  console.log(jwt.decode(authToken));

  try {
    const decoded = jwt.verify(authToken, process.env.JWT_SECRET!);
    console.log("\ndecoded\n", decoded, "\n");
    const userId = (decoded as JwtPayload & { id: string }).id;
    console.log(userId, "is here");
    const { itemId, quantity } = await req.json();
    console.log(itemId, quantity);
    if (!itemId || !quantity) {
      return NextResponse.json(
        { error: "Item ID and quantity are required" },
        { status: 400 }
      );
    }

    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userExists) {
      console.log("User not found for ID:", userId);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 🔐 Validate itemId exists
    const itemExistsInTheDatabase = await prisma.item.findUnique({
      where: { id: itemId },
    });

    if (!itemExistsInTheDatabase) {
      console.log("Item not found for ID:", itemId);
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const isItemBelongsToThisUser = await prisma.cartItem.findFirst({
      where: {
        userId,
        itemId,
      },
    });

    if (isItemBelongsToThisUser) {
      // If already in cart, update quantity
      const updatedItem = await prisma.cartItem.update({
        where: { id: isItemBelongsToThisUser.id },
        data: {
          quantity,
        },
      });

      return NextResponse.json({ success: true, cartItem: updatedItem });
    } else {
      // Else, add new cart item
      console.log("enter in the creating the item wale part");
      const newItem = await prisma.cartItem.create({
        data: {
          userId,
          itemId,
          quantity,
        },
      });

      return NextResponse.json({ success: true, cartItem: newItem });
    }
  } catch (err) {
    console.error("ADD TO CART ERROR", err);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}
