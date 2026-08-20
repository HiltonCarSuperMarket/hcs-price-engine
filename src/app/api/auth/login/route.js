import { NextResponse } from "next/server";
import {
  AUTH_COOKIE,
  authenticateUser,
  createSessionToken,
  ensureBootstrapAdmin,
  getAuthCookieOptions,
  toPublicUser,
} from "@/lib/auth";

export async function POST(request) {
  try {
    await ensureBootstrapAdmin();

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 },
      );
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const token = await createSessionToken(user);
    const response = NextResponse.json({
      success: true,
      user: toPublicUser(user),
    });

    response.cookies.set(AUTH_COOKIE, token, getAuthCookieOptions());
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 },
    );
  }
}
