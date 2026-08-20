import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ErrorBanner({ message, onRetry, className }) {
  if (!message) return null;

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-red-500/20 bg-red-950/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" />
        <div>
          <p className="text-sm font-medium text-red-300">Unable to load data</p>
          <p className="mt-0.5 text-sm text-slate-400">{message}</p>
        </div>
      </div>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="shrink-0 border-red-500/20 bg-transparent text-red-200 hover:bg-red-950/60"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </Button>
      )}
    </div>
  );
}
