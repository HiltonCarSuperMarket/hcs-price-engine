import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { countActiveAdmins, toPublicUser, VALID_ROLES } from "@/lib/auth";
import { requireAdmin } from "@/lib/require-auth";
import User from "@/models/User";

export async function PUT(request, { params }) {
  try {
    const { user: admin, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;
    const body = await request.json();
    const { name, email, password, role, isActive } = body;

    await connectDB();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (name !== undefined) {
      if (!name.trim()) {
        return NextResponse.json(
          { error: "Name cannot be empty" },
          { status: 400 },
        );
      }
      user.name = name.trim();
    }

    if (email !== undefined) {
      const nextEmail = email.toLowerCase().trim();
      if (!nextEmail) {
        return NextResponse.json(
          { error: "Email cannot be empty" },
          { status: 400 },
        );
      }
      const clash = await User.findOne({
        email: nextEmail,
        _id: { $ne: user._id },
      });
      if (clash) {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 409 },
        );
      }
      user.email = nextEmail;
    }

    if (role !== undefined) {
      if (!VALID_ROLES.includes(role)) {
        return NextResponse.json(
          { error: "Invalid role. Must be ADMIN or USER" },
          { status: 400 },
        );
      }

      const demotingLastAdmin =
        user.role === "ADMIN" &&
        role !== "ADMIN" &&
        (await countActiveAdmins(user._id)) === 0;

      if (demotingLastAdmin) {
        return NextResponse.json(
          { error: "Cannot change the role of the last active admin" },
          { status: 400 },
        );
      }

      user.role = role;
    }

    if (isActive !== undefined) {
      if (id === admin.id && isActive === false) {
        return NextResponse.json(
          { error: "You cannot deactivate your own account" },
          { status: 400 },
        );
      }

      const deactivatingLastAdmin =
        user.role === "ADMIN" &&
        user.isActive &&
        isActive === false &&
        (await countActiveAdmins(user._id)) === 0;

      if (deactivatingLastAdmin) {
        return NextResponse.json(
          { error: "Cannot deactivate the last active admin" },
          { status: 400 },
        );
      }

      user.isActive = Boolean(isActive);
    }

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { error: "Password must be at least 8 characters" },
          { status: 400 },
        );
      }
      user.password = password;
    }

    await user.save();

    return NextResponse.json({ success: true, user: toPublicUser(user) });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 400 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user: admin, error } = await requireAdmin(request);
    if (error) return error;

    const { id } = await params;

    if (id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete your own account" },
        { status: 400 },
      );
    }

    await connectDB();
    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (
      user.role === "ADMIN" &&
      user.isActive &&
      (await countActiveAdmins(user._id)) === 0
    ) {
      return NextResponse.json(
        { error: "Cannot delete the last active admin" },
        { status: 400 },
      );
    }

    await User.findByIdAndDelete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 },
    );
  }
}
