import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function requireAuth(request) {
  const user = await getSessionUser(request);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { user, error: null };
}

export async function requireAdmin(request) {
  const result = await requireAuth(request);
  if (result.error) return result;

  if (result.user.role !== "ADMIN") {
    return {
      user: result.user,
      error: NextResponse.json(
        { error: "Forbidden — admin access required" },
        { status: 403 },
      ),
    };
  }

  return result;
}
