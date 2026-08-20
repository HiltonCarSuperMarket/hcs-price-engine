"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { safeNextPathForRole } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getSafeNextPath(value) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.startsWith("/\\")
  ) {
    return "/";
  }
  return value;
}

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading, user } = useAuth();
  const requestedNext = getSafeNextPath(searchParams.get("next"));
  const nextPath = user
    ? safeNextPathForRole(user.role, requestedNext)
    : requestedNext;

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [loading, isAuthenticated, router, nextPath]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter both email and password");
      return;
    }

    setSubmitting(true);
    const result = await login(email.trim(), password);

    if (result.success) {
      router.replace(safeNextPathForRole(result.user.role, requestedNext));
      router.refresh();
      return;
    }

    setError(result.error || "Login failed. Please try again.");
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#37259b]">
        <Loader2 className="size-8 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-[#4d087c] via-[#37259b] to-[#047bd5]" />
        <div
          className="absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 84% 63%, rgba(255,255,255,0.23) 0 1px, transparent 1.8px)",
            backgroundSize: "14px 14px",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="relative mx-auto mb-4 h-10 w-52">
            <Image
              src="/logo-hilton.svg"
              alt="Hilton Car Supermarket"
              fill
              className="object-contain"
              priority
            />
          </div>
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.22em] text-blue-200/80">
            HCS Pricing Hub
          </p>
          <h1 className="mt-1 text-2xl font-extrabold text-white">Price2GO</h1>
        </div>

        <Card className="border-white/20 bg-white/95 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl">Sign in</CardTitle>
            <CardDescription>
              Use your Price2GO account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? (
                <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email">
                  <Mail className="size-3.5" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={submitting}
                  placeholder="you@company.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  <Lock className="size-3.5" />
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={submitting}
                  placeholder="Enter your password"
                />
              </div>

              <Button
                type="submit"
                className="h-11 w-full rounded-lg bg-[#4b087b] text-sm font-medium text-white shadow-[0_10px_24px_rgba(75,8,123,0.28)] hover:bg-[#37259b] hover:text-white focus-visible:ring-[#4b087b]/40 disabled:bg-[#4b087b]/50 disabled:text-white/80"
                disabled={submitting}
                size="lg"
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              Contact an administrator if you need an account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
