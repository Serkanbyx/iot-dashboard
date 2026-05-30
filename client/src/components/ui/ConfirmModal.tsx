import { useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";
import { cn } from "../../utils/cn";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  children?: ReactNode;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "primary",
  loading = false,
  onConfirm,
  onCancel,
  children,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !loading) onCancel();
    }
    if (open) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [open, loading, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => !loading && onCancel()}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-2xl glass border border-glass-border p-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            {message && (
              <p className="mt-2 text-sm text-text-secondary">{message}</p>
            )}

            {children && <div className="mt-4">{children}</div>}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={loading}
                className={cn(
                  "h-9 px-4 rounded-lg text-sm font-medium",
                  "text-text-secondary hover:bg-bg-card-hover",
                  "transition-colors duration-150 disabled:opacity-50"
                )}
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className={cn(
                  "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
                  "transition-colors duration-150 disabled:opacity-60 disabled:pointer-events-none",
                  variant === "danger"
                    ? "bg-danger hover:bg-danger/90"
                    : "bg-accent-blue hover:bg-accent-blue/90"
                )}
              >
                {loading && <Loader2 size={15} className="animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
