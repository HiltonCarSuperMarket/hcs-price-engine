"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { HcsBrandNavbar } from "@/components/hcs-brand-navbar";

export function PageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <HcsBrandNavbar
        title="Price2Profit"
        subtitle="HCS Pricing Hub"
        homeHref="/"
        right={<Skeleton className="h-9 w-40 rounded-lg bg-white/20" />}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="space-y-8">
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 bg-slate-800" />
            <Skeleton className="h-6 w-96 max-w-full bg-slate-800" />
          </div>

          <div className="bg-slate-800 border border-white/5 rounded-2xl p-6 space-y-4">
            <Skeleton className="h-8 w-48 bg-slate-700" />
            <Skeleton className="h-32 w-full bg-slate-700" />
            <div className="flex gap-4">
              <Skeleton className="h-10 w-32 bg-slate-700" />
              <Skeleton className="h-10 w-32 bg-slate-700" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-slate-800 border border-white/5 rounded-2xl p-6 space-y-3"
              >
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-8 w-32 bg-slate-700" />
                <Skeleton className="h-3 w-full bg-slate-700" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10">
        <Skeleton className="h-6 w-48 bg-slate-700" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="px-4 py-3 text-left">
                  <Skeleton className="h-4 w-20 bg-slate-700" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i} className="border-b border-white/5">
                {Array.from({ length: cols }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-16 bg-slate-700" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-6 space-y-3">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-3 w-full" />
    </Card>
  );
}

export function ConfigSkeleton() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-slate-800 border border-white/5 rounded-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <Skeleton className="h-6 w-32 bg-slate-700" />
            <Skeleton className="h-5 w-5 rounded bg-slate-700" />
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 bg-slate-700" />
                <Skeleton className="h-10 w-full bg-slate-700" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
