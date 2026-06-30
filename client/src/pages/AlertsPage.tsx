import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { CheckCheck, Trash2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import { useSocket } from "../hooks/useSocket";
import * as alertService from "../api/alertService";
import type {
  Alert,
  AlertAcknowledgedPayload,
  AlertBulkAcknowledgedPayload,
  AlertStats as AlertStatsData,
  AlertFilters,
} from "../types";
import AlertStats from "../components/alerts/AlertStats";
import AlertFilterBar, {
  type AlertFilterValues,
} from "../components/alerts/AlertFilterBar";
import AlertList from "../components/alerts/AlertList";
import Pagination from "../components/ui/Pagination";
import ConfirmModal from "../components/ui/ConfirmModal";
import PageTransition from "../components/ui/PageTransition";
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
  const [acknowledgeTarget, setAcknowledgeTarget] = useState<Alert | null>(null);
  const [noteInput, setNoteInput] = useState("");
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
    fetchAlerts(); // eslint-disable-line react-hooks/set-state-in-effect -- fetch on mount/filter change
  }, [fetchAlerts]);

  useEffect(() => {
    fetchStats(); // eslint-disable-line react-hooks/set-state-in-effect
  }, [fetchStats]);

  const handleFilterChange = useCallback(
    (key: keyof AlertFilterValues, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  // --- Open the acknowledge modal for a given alert ---
  const requestAcknowledge = useCallback(
    (id: string) => {
      const target = alerts.find((a) => a.id === id) ?? null;
      setAcknowledgeTarget(target);
      setNoteInput("");
    },
    [alerts]
  );

  // --- Single acknowledge with optional note + optimistic update ---
  const confirmAcknowledge = useCallback(async () => {
    if (!acknowledgeTarget) return;
    const id = acknowledgeTarget.id;
    const note = noteInput.trim();

    setAcknowledgingId(id);
    const previous = alerts;
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? {
              ...a,
              isAcknowledged: true,
              acknowledgedAt: new Date().toISOString(),
              acknowledgeNote: note || null,
            }
          : a
      )
    );

    try {
      const { alert } = await alertService.acknowledgeAlert(id, note || undefined);
      setAlerts((prev) => prev.map((a) => (a.id === id ? alert : a)));
      toast.success("Alert acknowledged.");
      setAcknowledgeTarget(null);
      fetchStats();
    } catch {
      setAlerts(previous);
      toast.error("Failed to acknowledge alert.");
    } finally {
      setAcknowledgingId(null);
    }
  }, [acknowledgeTarget, noteInput, alerts, fetchStats]);

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
    (payload: AlertAcknowledgedPayload) => {
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === payload.alertId
            ? {
                ...a,
                isAcknowledged: true,
                acknowledgedAt: a.acknowledgedAt ?? new Date().toISOString(),
              }
            : a
        )
      );
      fetchStats();
    },
    [fetchStats]
  );

  const handleBulkAcknowledged = useCallback(() => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.isAcknowledged
          ? a
          : {
              ...a,
              isAcknowledged: true,
              acknowledgedAt: a.acknowledgedAt ?? new Date().toISOString(),
            }
      )
    );
    fetchStats();
  }, [fetchStats]);

  useSocket<Alert>("alert:new", handleNewAlert);
  useSocket<AlertAcknowledgedPayload>(
    "alert:acknowledged",
    handleAlertAcknowledged
  );
  useSocket<AlertBulkAcknowledgedPayload>(
    "alert:bulk-acknowledged",
    handleBulkAcknowledged
  );

  const hasUnacknowledged = (stats?.unacknowledged ?? 0) > 0;

  return (
    <PageTransition className="flex flex-col gap-4">
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
        onAcknowledge={requestAcknowledge}
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

      {/* Single acknowledge with optional note */}
      <ConfirmModal
        open={acknowledgeTarget !== null}
        title="Acknowledge alert"
        message="Optionally add a note for the audit trail before acknowledging."
        confirmLabel="Acknowledge"
        variant="primary"
        loading={acknowledgingId !== null}
        onConfirm={confirmAcknowledge}
        onCancel={() => setAcknowledgeTarget(null)}
      >
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-text-secondary">Note (optional)</span>
          <textarea
            value={noteInput}
            onChange={(e) => setNoteInput(e.target.value.slice(0, 500))}
            rows={3}
            maxLength={500}
            placeholder="e.g. Investigated — sensor recalibrated."
            className={cn(
              "px-3 py-2 rounded-lg resize-none bg-bg-elevated border border-glass-border",
              "text-text-primary outline-none focus:border-accent-blue"
            )}
          />
          <span className="text-[10px] text-text-muted self-end">
            {noteInput.length}/500
          </span>
        </label>
      </ConfirmModal>

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
    </PageTransition>
  );
}
