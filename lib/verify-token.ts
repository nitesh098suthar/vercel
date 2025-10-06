import jwt, { JwtPayload } from "jsonwebtoken";

export interface DecodedToken extends JwtPayload {
  id: string;
  role: string;
  phoneNumber: string;
}

export function verifyJwt(token: string): DecodedToken | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedToken;
    return decoded;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return null;
  }
}
