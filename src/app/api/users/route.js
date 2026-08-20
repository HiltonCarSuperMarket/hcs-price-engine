import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { toPublicUser, VALID_ROLES } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-auth";
import User from "@/models/User";

export async function GET(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    await connectDB();
    const users = await User.find({}, "-password").sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      users: users.map(toPublicUser),
    });
  } catch (error) {
    console.error("Error listing users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { error } = await requireAdmin(request);
    if (error) return error;

    const { name, email, password, role = "USER" } = await request.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 },
      );
    }

    if (!VALID_ROLES.includes(role)) {
      return NextResponse.json(
        { error: "Invalid role. Must be ADMIN or USER" },
        { status: 400 },
      );
    }

    await connectDB();

    const existing = await User.findOne({
      email: email.toLowerCase().trim(),
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists" },
        { status: 409 },
      );
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role,
      isActive: true,
    });

    return NextResponse.json(
      { success: true, user: toPublicUser(user) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 400 },
    );
  }
}
