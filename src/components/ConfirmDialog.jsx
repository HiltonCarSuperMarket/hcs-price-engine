"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
  variant = "default",
}) {
  const confirmClass =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-500 text-white"
      : "bg-[#00dbcc] hover:bg-teal-400 text-slate-900";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showClose={!isLoading}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="px-5 py-2.5 rounded-lg border border-white/10 text-slate-300 hover:border-slate-500 hover:text-slate-100 transition-colors text-sm font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all text-sm disabled:opacity-50 ${confirmClass}`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              confirmLabel
            )}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
