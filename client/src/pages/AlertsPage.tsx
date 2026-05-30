import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { CheckCheck, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { useSocket } from "../hooks/useSocket";
import * as alertService from "../api/alertService";
import type { Alert, AlertStats as AlertStatsData, AlertFilters } from "../types";
import AlertStats from "../components/alerts/AlertStats";
import AlertFilterBar, {
  type AlertFilterValues,
} from "../components/alerts/AlertFilterBar";
import AlertList from "../components/alerts/AlertList";
import Pagination from "../components/ui/Pagination";
import ConfirmModal from "../components/ui/ConfirmModal";
import { cn } from "../utils/cn";

const PAGE_SIZE = 10;

const SORT_MAP: Record<string, { sort: string; order: string }> = {
  newest: { sort: "createdAt", order: "desc" },
  oldest: { sort: "createdAt", order: "asc" },
  severity: { sort: "severity", order: "desc" },
};

const INITIAL_FILTERS: AlertFilterValues = {
  severity: "",
  sensorType: "",
  isAcknowledged: "",
  sensorId: "",
  sort: "newest",
};

export default function AlertsPage() {
  const { isAdmin } = useAuth();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [stats, setStats] = useState<AlertStatsData | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<AlertFilterValues>(INITIAL_FILTERS);
  const [loading, setLoading] = useState(true);

  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);
  const [acknowledgingAll, setAcknowledgingAll] = useState(false);
  const [cleanupOpen, setCleanupOpen] = useState(false);
  const [cleanupDays, setCleanupDays] = useState(30);
  const [cleaningUp, setCleaningUp] = useState(false);

  const debouncedSensorId = useDebounce(filters.sensorId, 400);

  const queryFilters = useMemo<AlertFilters>(() => {
    const { sort, order } = SORT_MAP[filters.sort] ?? SORT_MAP.newest;
    const params: AlertFilters = { page, limit: PAGE_SIZE, sort, order };
    if (filters.severity) params.severity = filters.severity;
    if (filters.sensorType) params.sensorType = filters.sensorType;
    if (filters.isAcknowledged) params.isAcknowledged = filters.isAcknowledged;
    if (debouncedSensorId) params.sensorId = debouncedSensorId;
    return params;
  }, [
    page,
    filters.sort,
    filters.severity,
    filters.sensorType,
    filters.isAcknowledged,
    debouncedSensorId,
  ]);

  const fetchStats = useCallback(async () => {
    try {
      const data = await alertService.getAlertStats();
      setStats(data);
    } catch {
      // stats are non-critical; ignore
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await alertService.getAlerts(queryFilters);
      setAlerts(res.alerts);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error("Failed to load alerts.");
    } finally {
      setLoading(false);
    }
  }, [queryFilters]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleFilterChange = useCallback(
    (key: keyof AlertFilterValues, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  // --- Single acknowledge with optimistic update ---
  const handleAcknowledge = useCallback(
    async (id: string) => {
      setAcknowledgingId(id);
      const previous = alerts;
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, isAcknowledged: true, acknowledgedAt: new Date().toISOString() }
            : a
        )
      );

      try {
        const { alert } = await alertService.acknowledgeAlert(id);
        setAlerts((prev) => prev.map((a) => (a.id === id ? alert : a)));
        toast.success("Alert acknowledged.");
        fetchStats();
      } catch {
        setAlerts(previous);
        toast.error("Failed to acknowledge alert.");
      } finally {
        setAcknowledgingId(null);
      }
    },
    [alerts, fetchStats]
  );

  // --- Acknowledge all (admin) ---
  const handleAcknowledgeAll = useCallback(async () => {
    setAcknowledgingAll(true);
    try {
      const { acknowledged } = await alertService.acknowledgeAll();
      toast.success(`Acknowledged ${acknowledged} alert(s).`);
      setConfirmAllOpen(false);
      await Promise.all([fetchAlerts(), fetchStats()]);
    } catch {
      toast.error("Failed to acknowledge all alerts.");
    } finally {
      setAcknowledgingAll(false);
    }
  }, [fetchAlerts, fetchStats]);

  // --- Cleanup old alerts (admin) ---
  const handleCleanup = useCallback(async () => {
    setCleaningUp(true);
    try {
      const { deleted } = await alertService.deleteOldAlerts(cleanupDays);
      toast.success(`Deleted ${deleted} old alert(s).`);
      setCleanupOpen(false);
      await Promise.all([fetchAlerts(), fetchStats()]);
    } catch {
      toast.error("Failed to clean up alerts.");
    } finally {
      setCleaningUp(false);
    }
  }, [cleanupDays, fetchAlerts, fetchStats]);

  // --- Real-time: new alert ---
  const handleNewAlert = useCallback(
    (alert: Alert) => {
      fetchStats();

      const matches =
        (!filters.severity || alert.severity === filters.severity) &&
        (!filters.sensorType || alert.sensorType === filters.sensorType) &&
        (!debouncedSensorId || alert.sensorId === debouncedSensorId) &&
        filters.isAcknowledged !== "true";

      // Only prepend on the first page to keep pagination consistent.
      if (page === 1 && filters.sort === "newest" && matches) {
        setAlerts((prev) => {
          if (prev.some((a) => a.id === alert.id)) return prev;
          return [alert, ...prev].slice(0, PAGE_SIZE);
        });
        setTotal((t) => t + 1);
      }
    },
    [
      fetchStats,
      filters.severity,
      filters.sensorType,
      filters.isAcknowledged,
      filters.sort,
      debouncedSensorId,
      page,
    ]
  );

  // --- Real-time: alert acknowledged elsewhere ---
  const handleAlertAcknowledged = useCallback(
    (alert: Alert) => {
      setAlerts((prev) => prev.map((a) => (a.id === alert.id ? alert : a)));
      fetchStats();
    },
    [fetchStats]
  );

  useSocket<Alert>("alert:new", handleNewAlert);
  useSocket<Alert>("alert:acknowledged", handleAlertAcknowledged);

  const hasUnacknowledged = (stats?.unacknowledged ?? 0) > 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Alerts</h1>

        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setConfirmAllOpen(true)}
              disabled={!hasUnacknowledged}
              className={cn(
                "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium",
                "glass text-accent-emerald hover:bg-accent-emerald/10",
                "transition-colors duration-150",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              <CheckCheck size={16} />
              Acknowledge All
            </button>

            <button
              type="button"
              onClick={() => setCleanupOpen(true)}
              className={cn(
                "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-medium",
                "glass text-danger hover:bg-danger/10",
                "transition-colors duration-150"
              )}
            >
              <Trash2 size={16} />
              Cleanup
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <AlertStats stats={stats} />

      {/* Filter bar */}
      <AlertFilterBar filters={filters} onChange={handleFilterChange} />

      {/* Alert list */}
      <AlertList
        alerts={alerts}
        loading={loading}
        canAcknowledge={isAdmin}
        acknowledgingId={acknowledgingId}
        onAcknowledge={handleAcknowledge}
      />

      {/* Footer: count + pagination */}
      {!loading && total > 0 && (
        <div className="flex flex-col gap-3">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
          <p className="text-center text-xs text-text-muted">
            {total} alert{total === 1 ? "" : "s"} total
          </p>
        </div>
      )}

      {/* Acknowledge-all confirmation */}
      <ConfirmModal
        open={confirmAllOpen}
        title="Acknowledge all alerts?"
        message={`This will mark all ${
          stats?.unacknowledged ?? 0
        } unacknowledged alert(s) as acknowledged.`}
        confirmLabel="Acknowledge All"
        variant="primary"
        loading={acknowledgingAll}
        onConfirm={handleAcknowledgeAll}
        onCancel={() => setConfirmAllOpen(false)}
      />

      {/* Cleanup confirmation */}
      <ConfirmModal
        open={cleanupOpen}
        title="Clean up old alerts"
        message="Permanently delete acknowledged alerts older than the selected number of days."
        confirmLabel="Delete"
        variant="danger"
        loading={cleaningUp}
        onConfirm={handleCleanup}
        onCancel={() => setCleanupOpen(false)}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-secondary">Older than (days)</span>
          <input
            type="number"
            min={1}
            max={365}
            value={cleanupDays}
            onChange={(e) =>
              setCleanupDays(Math.max(1, Number(e.target.value) || 1))
            }
            className={cn(
              "h-9 px-3 rounded-lg bg-bg-elevated border border-glass-border",
              "text-text-primary outline-none focus:border-accent-blue"
            )}
          />
        </label>
      </ConfirmModal>
    </div>
  );
}
