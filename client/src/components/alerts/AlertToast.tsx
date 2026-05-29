import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { AlertTriangle, AlertOctagon } from "lucide-react";
import type { Alert } from "../../types";
import { cn } from "../../utils/cn";

interface AlertToastProps {
  alert: Alert;
  toastId: string;
  visible: boolean;
}

function formatSensorType(sensorType: string): string {
  return sensorType.charAt(0) + sensorType.slice(1).toLowerCase();
}

function useRelativeTime(timestamp: string): string {
  const [text, setText] = useState("just now");

  useEffect(() => {
    function update() {
      const diff = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 1000
      );
      if (diff < 5) setText("just now");
      else if (diff < 60) setText(`${diff}s ago`);
      else if (diff < 3600) setText(`${Math.floor(diff / 60)}m ago`);
      else setText(`${Math.floor(diff / 3600)}h ago`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return text;
}

export default function AlertToast({
  alert,
  toastId,
  visible,
}: AlertToastProps) {
  const navigate = useNavigate();
  const relativeTime = useRelativeTime(alert.createdAt);
  const isCritical = alert.severity === "CRITICAL";
  const Icon = isCritical ? AlertOctagon : AlertTriangle;

  function handleClick() {
    toast.dismiss(toastId);
    navigate("/alerts");
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 80 }}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
      className={cn(
        "flex items-stretch w-[360px] max-w-[90vw] rounded-xl overflow-hidden cursor-pointer",
        "glass shadow-lg",
        isCritical ? "bg-rose-500/10" : "bg-amber-500/5"
      )}
    >
      {/* Severity border strip */}
      <span
        className={cn(
          "w-1 shrink-0",
          isCritical ? "bg-danger" : "bg-warning"
        )}
      />

      <div className="flex items-start gap-3 p-3 flex-1 min-w-0">
        <div
          className={cn(
            "flex items-center justify-center h-8 w-8 rounded-lg shrink-0",
            isCritical ? "text-danger" : "text-warning"
          )}
        >
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-text-primary">
            {formatSensorType(alert.sensorType)} Alert
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">
            {alert.sensorId} · {alert.floor}
          </p>
          <p className="text-xs text-text-secondary mt-1 line-clamp-2">
            {alert.message}
          </p>
          <p className="text-[10px] text-text-muted mt-1.5 text-right">
            {relativeTime}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
