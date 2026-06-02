import { motion } from "framer-motion";
import { Mail, Check, Loader2, MessageSquareText } from "lucide-react";
import type { Alert } from "../../types";
import { useRelativeTime } from "../../hooks/useRelativeTime";
import SeverityBadge from "./SeverityBadge";
import { cn } from "../../utils/cn";

interface AlertItemProps {
  alert: Alert;
  canAcknowledge: boolean;
  acknowledging: boolean;
  onAcknowledge: (id: string) => void;
}

function formatType(sensorType: string): string {
  return sensorType.charAt(0) + sensorType.slice(1).toLowerCase();
}

export default function AlertItem({
  alert,
  canAcknowledge,
  acknowledging,
  onAcknowledge,
}: AlertItemProps) {
  const relativeTime = useRelativeTime(alert.createdAt);
  const isCritical = alert.severity === "CRITICAL";
  const isAck = alert.isAcknowledged;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      className={cn(
        "flex items-stretch rounded-xl overflow-hidden glass",
        isCritical && !isAck && "bg-rose-500/5",
        isAck && "opacity-60"
      )}
    >
      {/* Severity border strip */}
      <span
        className={cn("w-1 shrink-0", isCritical ? "bg-danger" : "bg-warning")}
      />

      <div className="flex-1 min-w-0 p-3">
        {/* Row 1: severity + sensor info */}
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityBadge severity={alert.severity} />
          <span className="text-xs text-text-secondary">
            {alert.sensorId} · {alert.floor}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted">
            {formatType(alert.sensorType)}
          </span>
        </div>

        {/* Row 2: message */}
        <p className="text-sm text-text-primary mt-1.5">{alert.message}</p>

        {/* Acknowledge note */}
        {isAck && alert.acknowledgeNote && (
          <div className="flex items-start gap-1.5 mt-2 rounded-lg bg-bg-elevated px-2.5 py-1.5">
            <MessageSquareText
              size={13}
              className="mt-0.5 shrink-0 text-text-muted"
            />
            <p className="text-xs text-text-secondary italic break-words">
              {alert.acknowledgeNote}
            </p>
          </div>
        )}

        {/* Row 3: footer */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <span className="text-xs text-text-muted">{relativeTime}</span>

          <div className="flex items-center gap-2">
            {alert.emailSent && (
              <span title="Email notification sent">
                <Mail size={14} className="text-text-muted" />
              </span>
            )}

            {isAck ? (
              <span className="flex items-center gap-1 text-xs text-success">
                <Check size={14} />
                Acknowledged
              </span>
            ) : (
              canAcknowledge && (
                <button
                  type="button"
                  onClick={() => onAcknowledge(alert.id)}
                  disabled={acknowledging}
                  className={cn(
                    "flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium",
                    "text-accent-emerald hover:bg-accent-emerald/10",
                    "transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none"
                  )}
                >
                  {acknowledging ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Check size={13} />
                  )}
                  Acknowledge
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
