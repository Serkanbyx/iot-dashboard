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
    if (!user) {
      setUnacknowledgedCount(0);
      return;
    }

    refreshCount();
  }, [user, refreshCount]);

  const handleNewAlert = useCallback((_alert: Alert) => {
    setUnacknowledgedCount((prev) => prev + 1);
  }, []);

  const handleAlertAcknowledged = useCallback(
    (_payload: AlertAcknowledgedPayload) => {
      setUnacknowledgedCount((prev) => Math.max(0, prev - 1));
    },
    []
  );

  const handleBulkAcknowledged = useCallback(
    (_payload: AlertBulkAcknowledgedPayload) => {
      setUnacknowledgedCount(0);
    },
    []
  );

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
    () => ({ unacknowledgedCount, refreshCount }),
    [unacknowledgedCount, refreshCount]
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
