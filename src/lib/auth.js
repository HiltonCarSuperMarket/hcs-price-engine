import connectDB from "@/lib/mongodb";
import { generateToken, verifyToken } from "@/lib/jwt";
import User from "@/models/User";
import { VALID_ROLES } from "@/lib/roles";

export { VALID_ROLES };
export const AUTH_COOKIE = "auth_token";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

export function toPublicUser(user) {
  if (!user) return null;
  if (typeof user.toPublicJSON === "function") {
    return user.toPublicJSON();
  }
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  };
}

export function getTokenFromRequest(request) {
  const cookieToken = request.cookies.get(AUTH_COOKIE)?.value;
  if (cookieToken) return cookieToken;

  const header = request.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    return header.slice(7);
  }

  return null;
}

export async function getSessionUser(request) {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  const decoded = await verifyToken(token);
  if (!decoded?.userId) return null;

  await connectDB();
  const user = await User.findById(decoded.userId);
  if (!user || !user.isActive) return null;

  return toPublicUser(user);
}

export async function createSessionToken(user) {
  return generateToken({
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
  });
}

export async function authenticateUser(email, password) {
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user || !user.isActive) return null;

  const valid = await user.comparePassword(password);
  if (!valid) return null;

  return user;
}

export async function countActiveAdmins(excludeId) {
  await connectDB();
  const filter = { role: "ADMIN", isActive: true };
  if (excludeId) {
    filter._id = { $ne: excludeId };
  }
  return User.countDocuments(filter);
}

export async function ensureBootstrapAdmin() {
  await connectDB();
  const existing = await User.countDocuments();
  if (existing > 0) return null;

  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME?.trim() || "Administrator";

  if (!email || !password) {
    console.warn(
      "No users exist. Set ADMIN_EMAIL and ADMIN_PASSWORD to bootstrap the first admin.",
    );
    return null;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: "ADMIN",
    isActive: true,
  });

  return toPublicUser(user);
}
