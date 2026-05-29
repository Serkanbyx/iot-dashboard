import { useEffect, useState, useCallback, useMemo } from "react";
import toast from "react-hot-toast";
import { useSocketContext } from "../contexts/SocketContext";
import { useSocket } from "../hooks/useSocket";
import * as sensorService from "../api/sensorService";
import * as alertService from "../api/alertService";
import * as thresholdService from "../api/thresholdService";
import type { SensorReading, ThresholdConfig, Alert } from "../types";
import LiveIndicator from "../components/dashboard/LiveIndicator";
import FloorTabs from "../components/dashboard/FloorTabs";
import AlertSummaryBar from "../components/dashboard/AlertSummaryBar";
import AlertToast from "../components/dashboard/AlertToast";
import SensorGrid from "../components/dashboard/SensorGrid";

const HISTORY_CAP = 60;

function readingKey(sensorId: string, type: string) {
  return `${sensorId}-${type}`;
}

export default function DashboardPage() {
  const { isConnected } = useSocketContext();

  const [readings, setReadings] = useState<Map<string, SensorReading>>(
    new Map()
  );
  const [history, setHistory] = useState<Map<string, SensorReading[]>>(
    new Map()
  );
  const [thresholds, setThresholds] = useState<ThresholdConfig[]>([]);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [loading, setLoading] = useState(true);
  const [unacknowledgedCount, setUnacknowledgedCount] = useState(0);

  // Initial data fetch
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [latestRes, thresholdRes, statsRes] = await Promise.all([
          sensorService.getLatestReadings(),
          thresholdService.getAllThresholds(),
          alertService.getAlertStats(),
        ]);

        const readingsMap = new Map<string, SensorReading>();
        for (const r of latestRes.readings) {
          readingsMap.set(readingKey(r.sensorId, r.type), r);
        }
        setReadings(readingsMap);
        setThresholds(thresholdRes.thresholds);
        setUnacknowledgedCount(statsRes.unacknowledged);
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
    setUnacknowledgedCount((prev) => prev + 1);
    toast.custom((t) => <AlertToast alert={alert} toastId={t.id} />, {
      duration: 5000,
    });
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Alert summary bar */}
      <AlertSummaryBar count={unacknowledgedCount} />

      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <LiveIndicator status={isConnected ? "online" : "offline"} />
          </div>
          <p className="text-sm text-text-secondary mt-0.5">
            Real-time sensor monitoring
          </p>
        </div>
      </div>

      {/* Floor tabs */}
      <FloorTabs
        tabs={floors}
        activeTab={selectedFloor}
        onTabChange={setSelectedFloor}
      />

      {/* Sensor grid */}
      <SensorGrid
        readings={readingsList}
        history={history}
        thresholds={thresholds}
        selectedFloor={selectedFloor}
      />
    </div>
  );
}
