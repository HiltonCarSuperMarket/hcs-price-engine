import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#37259b]">
      <Loader2 className="size-8 animate-spin text-white" />
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
