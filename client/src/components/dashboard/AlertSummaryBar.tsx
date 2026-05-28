import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, ArrowRight, X } from "lucide-react";
import { cn } from "../../utils/cn";

interface AlertSummaryBarProps {
  count: number;
}

const DISMISS_KEY = "alert-bar-dismissed-at";

function isDismissedRecently(): boolean {
  const dismissed = localStorage.getItem(DISMISS_KEY);
  if (!dismissed) return false;
  const elapsed = Date.now() - Number(dismissed);
  return elapsed < 1000 * 60 * 30; // 30 minutes
}

export default function AlertSummaryBar({ count }: AlertSummaryBarProps) {
  const [dismissed, setDismissed] = useState(isDismissedRecently);

  function handleDismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setDismissed(true);
  }

  const visible = count > 0 && !dismissed;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={cn(
            "flex items-center justify-between gap-3 px-4 py-3 rounded-xl mb-4",
            "glass border-l-4",
            count >= 5
              ? "border-l-danger"
              : "border-l-warning"
          )}
        >
          <div className="flex items-center gap-3">
            <AlertTriangle
              size={18}
              className={cn(
                "shrink-0 animate-pulse-slow",
                count >= 5 ? "text-danger" : "text-warning"
              )}
            />
            <span className="text-sm font-medium">
              <span className="font-bold">{count}</span> unacknowledged alert
              {count !== 1 && "s"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/alerts"
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                "text-accent-blue hover:text-accent-blue/80 transition-colors"
              )}
            >
              View All
              <ArrowRight size={14} />
            </Link>
            <button
              type="button"
              onClick={handleDismiss}
              className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
              aria-label="Dismiss alert bar"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
