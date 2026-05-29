import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { AlertTriangle, X } from "lucide-react";
import type { Alert } from "../../types";
import { cn } from "../../utils/cn";

interface AlertToastProps {
  alert: Alert;
  toastId: string;
}

export default function AlertToast({ alert, toastId }: AlertToastProps) {
  const navigate = useNavigate();
  const isCritical = alert.severity === "CRITICAL";

  function handleView() {
    toast.dismiss(toastId);
    navigate("/alerts");
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 w-80 max-w-full p-3 rounded-xl",
        "glass border shadow-lg",
        isCritical ? "border-danger/40" : "border-warning/40"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
          isCritical
            ? "bg-danger/20 text-danger"
            : "bg-warning/20 text-warning"
        )}
      >
        <AlertTriangle size={16} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[10px] font-bold uppercase tracking-wider",
              isCritical ? "text-danger" : "text-warning"
            )}
          >
            {alert.severity}
          </span>
          <span className="text-[10px] text-text-muted">
            {alert.sensorId} · {alert.floor}
          </span>
        </div>
        <p className="text-sm text-text-primary mt-0.5 line-clamp-2">
          {alert.message}
        </p>
        <button
          type="button"
          onClick={handleView}
          className="mt-1.5 text-xs font-medium text-accent-blue hover:text-accent-blue/80 transition-colors"
        >
          View alerts
        </button>
      </div>

      <button
        type="button"
        onClick={() => toast.dismiss(toastId)}
        className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}
