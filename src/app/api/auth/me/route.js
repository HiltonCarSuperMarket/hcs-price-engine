import { NextResponse } from "next/server";
import { ensureBootstrapAdmin, getSessionUser } from "@/lib/auth";

export async function GET(request) {
  try {
    await ensureBootstrapAdmin();

    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired session" },
        { status: 401 },
      );
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Session verification error:", error);
    return NextResponse.json(
      { error: "Session verification failed" },
      { status: 500 },
    );
  }
}
