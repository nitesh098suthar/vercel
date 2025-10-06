// /app/api/user/current/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";

export async function GET(req: NextRequest) {
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
      include: {
        cartItems: {
          include: {
            item: true,
          },
        },
        orders: {
          include: {
            items: {
              include: {
                item: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                  },
                },
              },
            },
            shippingAddressForm: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("GET USER ERROR:", error);
    return NextResponse.json(
      { error: "Invalid or expired authToken" },
      { status: 401 }
    );
  }
}
