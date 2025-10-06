import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: Token missing" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1]; // Bearer <token>

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);

    return NextResponse.json(
      {
        message: "Owner data fetched successfully",
        owner: decoded, // pura owner object jo token me save kiya tha
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Invalid or expired token", error },
      { status: 401 }
    );
  }
}
