"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Loader2,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserPlus,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { useRequireAdmin } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorBanner } from "@/components/ui/error-banner";
import { ConfigSkeleton } from "@/components/SkeletonLoader";
import { roleLabel } from "@/lib/roles";

const EMPTY_FORM = {
  name: "",
  email: "",
  password: "",
  role: "USER",
  isActive: true,
};

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-GB");
}

export function UsersManager() {
  const { user: currentUser, loading: authLoading, isAdmin } = useRequireAdmin();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const response = await fetch("/api/users", { credentials: "include" });
      const data = await response.json();
      if (!response.ok) {
        setFetchError(data.error ?? "Failed to load users");
        setUsers([]);
        return;
      }
      setUsers(data.users ?? []);
    } catch {
      setFetchError("Failed to load users. Check your connection.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchUsers();
    }
  }, [authLoading, isAdmin, fetchUsers]);

  const isEditing = Boolean(editingId);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
      isActive: user.isActive,
    });
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!form.name.trim() || !form.email.trim()) {
      toast.error("Name and email are required");
      return;
    }

    if (!isEditing && form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    if (isEditing && form.password && form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        isActive: form.isActive,
      };
      if (form.password) payload.password = form.password;

      const response = await fetch(
        isEditing ? `/api/users/${editingId}` : "/api/users",
        {
          method: isEditing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(
            isEditing ? payload : { ...payload, password: form.password },
          ),
        },
      );

      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to save user");
        return;
      }

      toast.success(isEditing ? "User updated" : `User "${payload.name}" created`);
      closeForm();
      fetchUsers();
    } catch {
      toast.error("Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    if (user.id === currentUser?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email})? This cannot be undone.`,
    );
    if (!confirmed) return;

    setDeletingId(user.id);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete user");
        return;
      }
      toast.success(`Deleted ${user.name}`);
      if (editingId === user.id) closeForm();
      fetchUsers();
    } catch {
      toast.error("Failed to delete user");
    } finally {
      setDeletingId(null);
    }
  };

  const sortedUsers = useMemo(
    () =>
      [...users].sort((a, b) => {
        if (a.role !== b.role) return a.role === "ADMIN" ? -1 : 1;
        return a.name.localeCompare(b.name);
      }),
    [users],
  );

  if (authLoading || (!isAdmin && currentUser)) {
    return <ConfigSkeleton />;
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50">
            User management
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create, edit, and remove accounts. Only admins can access this page.
          </p>
        </div>
        <Button
          onClick={formOpen && !isEditing ? closeForm : openCreate}
          className="bg-[#00dbcc] text-slate-900 hover:bg-teal-400"
        >
          {formOpen && !isEditing ? (
            <>
              <X className="size-4" />
              Cancel
            </>
          ) : (
            <>
              <UserPlus className="size-4" />
              Add user
            </>
          )}
        </Button>
      </div>

      {formOpen ? (
        <div className="rounded-2xl border border-white/5 bg-slate-800 p-6 shadow-xl">
          <div className="mb-5 flex items-center gap-2">
            {isEditing ? (
              <Pencil className="size-5 text-[#00dbcc]" />
            ) : (
              <Plus className="size-5 text-[#00dbcc]" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-slate-50">
                {isEditing ? "Edit user" : "Create user"}
              </h2>
              <p className="text-sm text-slate-400">
                {isEditing
                  ? "Leave password blank to keep the current password."
                  : "New users can sign in immediately with the password you set."}
              </p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name" className="text-slate-300">
                Name
              </Label>
              <Input
                id="user-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                disabled={saving}
                placeholder="Full name"
                className="border-white/10 bg-slate-950 text-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email" className="text-slate-300">
                Email
              </Label>
              <Input
                id="user-email"
                type="email"
                value={form.email}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                disabled={saving}
                placeholder="name@company.com"
                className="border-white/10 bg-slate-950 text-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-password" className="text-slate-300">
                {isEditing ? "New password (optional)" : "Password"}
              </Label>
              <Input
                id="user-password"
                type="password"
                value={form.password}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                disabled={saving}
                placeholder={
                  isEditing ? "Leave blank to keep current" : "Minimum 8 characters"
                }
                autoComplete="new-password"
                className="border-white/10 bg-slate-950 text-slate-50"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select
                value={form.role}
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, role: value }))
                }
                disabled={saving}
              >
                <SelectTrigger className="w-full border-white/10 bg-slate-950 text-slate-50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-white/10 bg-slate-950 text-slate-50">
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEditing ? (
              <div className="space-y-2">
                <Label className="text-slate-300">Status</Label>
                <Select
                  value={form.isActive ? "active" : "inactive"}
                  onValueChange={(value) =>
                    setForm((current) => ({
                      ...current,
                      isActive: value === "active",
                    }))
                  }
                  disabled={saving || editingId === currentUser.id}
                >
                  <SelectTrigger className="w-full border-white/10 bg-slate-950 text-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-white/10 bg-slate-950 text-slate-50">
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="flex items-end gap-2 sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                onClick={closeForm}
                disabled={saving}
                className="border-white/10 bg-transparent text-slate-300 hover:bg-slate-900 hover:text-slate-50"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-[#00dbcc] text-slate-900 hover:bg-teal-400"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                {isEditing ? "Save changes" : "Create user"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/5 bg-slate-800 p-6 shadow-xl">
        <div className="mb-5 flex items-center gap-2">
          <UsersIcon className="size-5 text-[#00dbcc]" />
          <div>
            <h2 className="text-lg font-semibold text-slate-50">
              All users ({users.length})
            </h2>
            <p className="text-sm text-slate-400">
              Inactive users cannot sign in. The last admin cannot be removed or
              demoted.
            </p>
          </div>
        </div>

        {fetchError ? (
          <ErrorBanner message={fetchError} onRetry={fetchUsers} />
        ) : loading ? (
          <ConfigSkeleton />
        ) : sortedUsers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="No users yet"
            description="Create the first additional user to share access."
            action={
              <Button
                onClick={openCreate}
                className="bg-[#00dbcc] text-slate-900 hover:bg-teal-400"
              >
                <UserPlus className="size-4" />
                Add user
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-[#00dbcc]">Name</TableHead>
                <TableHead className="text-[#00dbcc]">Email</TableHead>
                <TableHead className="text-[#00dbcc]">Role</TableHead>
                <TableHead className="text-[#00dbcc]">Status</TableHead>
                <TableHead className="text-[#00dbcc]">Created</TableHead>
                <TableHead className="text-right text-[#00dbcc]">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedUsers.map((user) => (
                <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.03]">
                  <TableCell className="font-medium text-slate-50">
                    <span className="inline-flex items-center gap-2">
                      {user.name}
                      {user.id === currentUser.id ? (
                        <Badge
                          variant="outline"
                          className="border-white/20 text-slate-300"
                        >
                          You
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-slate-300">{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.role === "ADMIN" ? "default" : "secondary"}
                      className={
                        user.role === "ADMIN"
                          ? "bg-[#00dbcc] text-slate-900"
                          : "bg-slate-700 text-slate-200"
                      }
                    >
                      {user.role === "ADMIN" ? <Shield className="size-3" /> : null}
                      {roleLabel(user.role)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "outline" : "destructive"}
                      className={
                        user.isActive
                          ? "border-emerald-500/40 text-emerald-300"
                          : ""
                      }
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {formatDate(user.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEdit(user)}
                        aria-label={`Edit ${user.name}`}
                        className="text-slate-400 hover:bg-slate-900 hover:text-slate-50"
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(user)}
                        disabled={
                          user.id === currentUser.id || deletingId === user.id
                        }
                        aria-label={`Delete ${user.name}`}
                        className="text-slate-400 hover:bg-red-950/40 hover:text-red-400"
                      >
                        {deletingId === user.id ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="size-3.5 text-red-400" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
