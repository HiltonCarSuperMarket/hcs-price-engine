"use client";

import { UsersManager } from "@/components/users/UsersManager";

export default function UsersPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 pb-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <UsersManager />
      </div>
    </main>
  );
}
