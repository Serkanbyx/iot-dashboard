import { useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { CheckCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useDebounce } from "../hooks/useDebounce";
import * as alertService from "../api/alertService";
import type { Alert, AlertStats as AlertStatsData, AlertFilters } from "../types";
import AlertStats from "../components/alerts/AlertStats";
import AlertFilterBar, {
  type AlertFilterValues,
} from "../components/alerts/AlertFilterBar";
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
  const [acknowledging, setAcknowledging] = useState(false);

  const debouncedSensorId = useDebounce(filters.sensorId, 400);

  const queryFilters = useMemo<AlertFilters>(() => {
    const { sort, order } = SORT_MAP[filters.sort] ?? SORT_MAP.newest;
    const params: AlertFilters = {
      page,
      limit: PAGE_SIZE,
      sort,
      order,
    };
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

  // Reset to page 1 whenever filters change
  const handleFilterChange = useCallback(
    (key: keyof AlertFilterValues, value: string) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
      setPage(1);
    },
    []
  );

  const handleAcknowledgeAll = useCallback(async () => {
    setAcknowledging(true);
    try {
      const { acknowledged } = await alertService.acknowledgeAll();
      toast.success(`Acknowledged ${acknowledged} alert(s).`);
      await Promise.all([fetchAlerts(), fetchStats()]);
    } catch {
      toast.error("Failed to acknowledge all alerts.");
    } finally {
      setAcknowledging(false);
    }
  }, [fetchAlerts, fetchStats]);

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">Alerts</h1>
        {isAdmin && (
          <button
            type="button"
            onClick={handleAcknowledgeAll}
            disabled={acknowledging || (stats?.unacknowledged ?? 0) === 0}
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
        )}
      </div>

      {/* Stats */}
      <AlertStats stats={stats} />

      {/* Filter bar */}
      <AlertFilterBar filters={filters} onChange={handleFilterChange} />

      {/* Alert list placeholder — implemented in Step 31 */}
      <div className="glass rounded-xl p-4 min-h-[200px] flex items-center justify-center">
        <p className="text-sm text-text-muted">
          {loading
            ? "Loading alerts..."
            : `${total} alert(s) · page ${page} of ${totalPages}`}
        </p>
      </div>
    </div>
  );
}
