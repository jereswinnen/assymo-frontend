import { NextRequest, NextResponse } from "next/server";
import {
  validatePassword,
  generateSessionToken,
  setSessionCookie,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    // Validate password
    if (!validatePassword(password)) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 },
      );
    }

    // Generate session token
    const sessionToken = generateSessionToken();

    // Set session cookie
    await setSessionCookie(sessionToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
