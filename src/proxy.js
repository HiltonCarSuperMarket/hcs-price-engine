import { NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { canAccessApi, canAccessPage, homePathForRole } from "./lib/roles";

const AUTH_COOKIE = "auth_token";

const PUBLIC_PAGE_PATHS = ["/login"];
const PUBLIC_API_PATHS = ["/api/auth/login", "/api/auth/logout"];

function matchesPath(pathname, prefixes) {
  return prefixes.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

async function getSessionPayload(request) {
  const token = request.cookies.get(AUTH_COOKIE)?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return null;

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(secret),
    );
    return payload;
  } catch {
    return null;
  }
}

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const session = await getSessionPayload(request);
  const authenticated = Boolean(session);
  const isApi = pathname.startsWith("/api/");

  if (isApi) {
    if (matchesPath(pathname, PUBLIC_API_PATHS)) {
      return NextResponse.next();
    }

    if (!authenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canAccessApi(session.role, pathname, request.method)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.next();
  }

  if (!authenticated && !matchesPath(pathname, PUBLIC_PAGE_PATHS)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (authenticated && pathname === "/login") {
    return NextResponse.redirect(
      new URL(homePathForRole(session.role), request.url),
    );
  }

  if (authenticated && !canAccessPage(session.role, pathname)) {
    return NextResponse.redirect(
      new URL(homePathForRole(session.role), request.url),
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
