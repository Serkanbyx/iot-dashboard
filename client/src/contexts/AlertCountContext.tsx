import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import { useSocket } from "../hooks/useSocket";
import * as alertService from "../api/alertService";
import type {
  Alert,
  AlertAcknowledgedPayload,
  AlertBulkAcknowledgedPayload,
} from "../types";

interface AlertCountContextValue {
  unacknowledgedCount: number;
  refreshCount: () => Promise<void>;
}

const AlertCountContext = createContext<AlertCountContextValue | null>(null);

export function AlertCountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  const refreshCount = useCallback(async () => {
    try {
      const stats = await alertService.getAlertStats();
      setUnacknowledgedCount(stats.unacknowledged);
    } catch {
      // stats are non-critical; ignore
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    void alertService
      .getAlertStats()
      .then((stats) => {
        if (!cancelled) {
          setUnacknowledgedCount(stats.unacknowledged);
        }
      })
      .catch(() => {
        // stats are non-critical; ignore
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleNewAlert = useCallback(() => {
    setUnacknowledgedCount((prev) => prev + 1);
  }, []);

  const handleAlertAcknowledged = useCallback(() => {
    void refreshCount();
  }, [refreshCount]);

  const handleBulkAcknowledged = useCallback(() => {
    void refreshCount();
  }, [refreshCount]);

  useSocket<Alert>("alert:new", handleNewAlert);
  useSocket<AlertAcknowledgedPayload>(
    "alert:acknowledged",
    handleAlertAcknowledged
  );
  useSocket<AlertBulkAcknowledgedPayload>(
    "alert:bulk-acknowledged",
    handleBulkAcknowledged
  );

  const value = useMemo(
    () => ({
      unacknowledgedCount: user ? unacknowledgedCount : 0,
      refreshCount,
    }),
    [user, unacknowledgedCount, refreshCount]
  );

  return (
    <AlertCountContext.Provider value={value}>
      {children}
    </AlertCountContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAlertCount(): AlertCountContextValue {
  const context = useContext(AlertCountContext);
  if (!context) {
    throw new Error("useAlertCount must be used within an AlertCountProvider");
  }
  return context;
}
