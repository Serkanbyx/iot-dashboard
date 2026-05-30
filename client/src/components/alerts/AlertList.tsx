import { AnimatePresence } from "framer-motion";
import { BellOff } from "lucide-react";
import type { Alert } from "../../types";
import AlertItem from "./AlertItem";
import EmptyState from "../ui/EmptyState";

interface AlertListProps {
  alerts: Alert[];
  loading: boolean;
  canAcknowledge: boolean;
  acknowledgingId: string | null;
  onAcknowledge: (id: string) => void;
}

export default function AlertList({
  alerts,
  loading,
  canAcknowledge,
  acknowledgingId,
  onAcknowledge,
}: AlertListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-9 w-9 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <EmptyState
        icon={BellOff}
        title="No alerts found"
        description="No alerts match the current filters."
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <AnimatePresence initial={false}>
        {alerts.map((alert) => (
          <AlertItem
            key={alert.id}
            alert={alert}
            canAcknowledge={canAcknowledge}
            acknowledging={acknowledgingId === alert.id}
            onAcknowledge={onAcknowledge}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
