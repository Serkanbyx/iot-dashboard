import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useSocket } from "../hooks/useSocket";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import * as sensorService from "../api/sensorService";
import * as thresholdService from "../api/thresholdService";
import type { SensorReading, ThresholdConfig, Alert } from "../types";
import { useAlertCount } from "../contexts/AlertCountContext";
import LiveIndicator from "../components/dashboard/LiveIndicator";
import FloorTabs from "../components/dashboard/FloorTabs";
import AlertSummaryBar from "../components/dashboard/AlertSummaryBar";
import AlertToast from "../components/alerts/AlertToast";
import SensorGrid from "../components/dashboard/SensorGrid";
import FloorPlan from "../components/dashboard/FloorPlan";
import DashboardSkeleton from "../components/skeletons/DashboardSkeleton";
import PageTransition from "../components/ui/PageTransition";
import SegmentedControl from "../components/ui/SegmentedControl";

const HISTORY_CAP = 60;

type DashboardView = "grid" | "map";

const VIEW_OPTIONS: { value: DashboardView; label: string }[] = [
  { value: "grid", label: "Grid" },
  { value: "map", label: "Map" },
];

function readingKey(sensorId: string, type: string) {
  return `${sensorId}-${type}`;
}

export default function DashboardPage() {
  const { indicatorStatus } = useConnectionStatus();
  const { unacknowledgedCount } = useAlertCount();

  const [readings, setReadings] = useState<Map<string, SensorReading>>(
    new Map()
  );
  const [history, setHistory] = useState<Map<string, SensorReading[]>>(
    new Map()
  );
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [view, setView] = useState<DashboardView>("grid");
  const [loading, setLoading] = useState(true);

  // Initial data fetch
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [latestRes, thresholdRes] = await Promise.all([
          sensorService.getLatestReadings(),
          thresholdService.getAllThresholds(),
        ]);

        const readingsMap = new Map<string, SensorReading>();
        for (const r of latestRes.readings) {
          readingsMap.set(readingKey(r.sensorId, r.type), r);
        }
        setReadings(readingsMap);
        setThresholds(thresholdRes.thresholds);
      } catch {
        toast.error("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  // Socket: sensor:data
  const handleSensorData = useCallback((data: SensorReading) => {
    const key = readingKey(data.sensorId, data.type);

    setReadings((prev) => {
      const next = new Map(prev);
      next.set(key, data);
      return next;
    });

    setHistory((prev) => {
      const next = new Map(prev);
      const existing = next.get(key) ?? [];
      const updated = [...existing, data].slice(-HISTORY_CAP);
      next.set(key, updated);
      return next;
    });
  }, []);

  useSocket<SensorReading>("sensor:data", handleSensorData);

  // Socket: alert:new
  const handleNewAlert = useCallback((alert: Alert) => {
    toast.custom(
      (t) => <AlertToast alert={alert} toastId={t.id} visible={t.visible} />,
      { duration: 6000 }
    );
  }, []);

  useSocket<Alert>("alert:new", handleNewAlert);

  // Floor tabs with counts
  const floors = useMemo(() => {
    const allReadings = Array.from(readings.values());
    const floorSet = new Set(allReadings.map((r) => r.floor));
    const sorted = Array.from(floorSet).sort();

    return [
      { id: "all", label: "All", count: allReadings.length },
      ...sorted.map((floor) => ({
        id: floor,
        label: floor.replace(/^floor/i, "Floor "),
        count: allReadings.filter((r) => r.floor === floor).length,
      })),
    ];
  }, [readings]);

  const readingsList = useMemo(() => Array.from(readings.values()), [readings]);

  if (loading) return <DashboardSkeleton />;

  return (
    <PageTransition className="flex flex-col gap-4">
      {/* Alert summary bar */}
      <AlertSummaryBar count={unacknowledgedCount} />

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <LiveIndicator status={indicatorStatus} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time sensor monitoring
          </p>
        </div>
      </div>

      {/* Floor tabs + view toggle */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <FloorTabs
          tabs={floors}
          activeTab={selectedFloor}
          onTabChange={setSelectedFloor}
        />
        <SegmentedControl
          options={VIEW_OPTIONS}
          value={view}
          onChange={setView}
        />
      </div>

      {/* Sensor view */}
      {view === "grid" ? (
        <SensorGrid
          readings={readingsList}
          history={history}
          thresholds={thresholds}
          selectedFloor={selectedFloor}
        />
      ) : (
        <FloorPlan
          readings={readingsList}
          thresholds={thresholds}
          selectedFloor={selectedFloor}
        />
      )}
    </PageTransition>
  );
}
