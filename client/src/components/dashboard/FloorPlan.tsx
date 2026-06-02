import { useMemo } from "react";
import { WifiOff } from "lucide-react";
import type { SensorReading, ThresholdConfig } from "../../types";
import EmptyState from "../ui/EmptyState";
import { getAlertState, worstState, type AlertState } from "../../utils/alertState";
import { cn } from "../../utils/cn";

interface FloorPlanProps {
  readings: SensorReading[];
  thresholds: ThresholdConfig[];
  selectedFloor: string;
}

interface SensorNode {
  sensorId: string;
  state: AlertState;
  readings: { reading: SensorReading; state: AlertState }[];
}

const STATE_STYLES: Record<
  AlertState,
  { dot: string; ring: string; text: string; label: string }
> = {
  normal: {
    dot: "bg-accent-emerald",
    ring: "bg-accent-emerald/40",
    text: "text-accent-emerald",
    label: "Normal",
  },
  warning: {
    dot: "bg-warning",
    ring: "bg-warning/40",
    text: "text-warning",
    label: "Warning",
  },
  critical: {
    dot: "bg-danger",
    ring: "bg-danger/50",
    text: "text-danger",
    label: "Critical",
  },
};

function formatType(type: string): string {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function formatFloor(floor: string): string {
  return floor.replace(/^floor/i, "Floor ");
}

export default function FloorPlan({
  readings,
  thresholds,
  selectedFloor,
}: FloorPlanProps) {
  const thresholdByType = useMemo(() => {
    const map = new Map<string, ThresholdConfig>();
    for (const t of thresholds) map.set(t.sensorType.toLowerCase(), t);
    return map;
  }, [thresholds]);

  const floors = useMemo(() => {
    const filtered =
      selectedFloor === "all"
        ? readings
        : readings.filter((r) => r.floor === selectedFloor);

    const byFloor = new Map<string, Map<string, SensorReading[]>>();
    for (const reading of filtered) {
      if (!byFloor.has(reading.floor)) byFloor.set(reading.floor, new Map());
      const sensorMap = byFloor.get(reading.floor)!;
      const list = sensorMap.get(reading.sensorId) ?? [];
      list.push(reading);
      sensorMap.set(reading.sensorId, list);
    }

    return Array.from(byFloor.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([floor, sensorMap]) => {
        const nodes: SensorNode[] = Array.from(sensorMap.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([sensorId, sensorReadings]) => {
            const readingStates = sensorReadings.map((reading) => ({
              reading,
              state: getAlertState(
                reading.value,
                thresholdByType.get(reading.type)
              ),
            }));
            return {
              sensorId,
              state: worstState(readingStates.map((r) => r.state)),
              readings: readingStates,
            };
          });
        return { floor, nodes };
      });
  }, [readings, selectedFloor, thresholdByType]);

  if (floors.length === 0) {
    return (
      <EmptyState
        icon={WifiOff}
        title="No sensors detected"
        description="Waiting for sensor data to arrive. Check your device connections."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {floors.map(({ floor, nodes }) => (
        <FloorBlueprint key={floor} floor={floor} nodes={nodes} />
      ))}
    </div>
  );
}

function FloorBlueprint({
  floor,
  nodes,
}: {
  floor: string;
  nodes: SensorNode[];
}) {
  const cols = Math.min(nodes.length, Math.ceil(Math.sqrt(nodes.length)) + 1);
  const rows = Math.max(1, Math.ceil(nodes.length / cols));

  const positioned = nodes.map((node, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      ...node,
      x: ((col + 0.5) / cols) * 100,
      y: ((row + 0.5) / rows) * 100,
    };
  });

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-text-secondary">
          {formatFloor(floor)}
        </h2>
        <Legend />
      </div>

      <div
        className="relative w-full"
        style={{ aspectRatio: `${cols} / ${rows}`, minHeight: 160 }}
      >
        {/* Blueprint background */}
        <svg
          className="absolute inset-0 h-full w-full text-glass-border"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <rect
            x="1"
            y="1"
            width="98"
            height="98"
            rx="2"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="2 1.5"
          />
          {Array.from({ length: cols - 1 }, (_, i) => (
            <line
              key={`v-${i}`}
              x1={((i + 1) / cols) * 100}
              y1="1"
              x2={((i + 1) / cols) * 100}
              y2="99"
              stroke="currentColor"
              strokeWidth="0.3"
              strokeDasharray="1.5 1.5"
              opacity="0.5"
            />
          ))}
          {Array.from({ length: rows - 1 }, (_, i) => (
            <line
              key={`h-${i}`}
              x1="1"
              y1={((i + 1) / rows) * 100}
              x2="99"
              y2={((i + 1) / rows) * 100}
              stroke="currentColor"
              strokeWidth="0.3"
              strokeDasharray="1.5 1.5"
              opacity="0.5"
            />
          ))}
        </svg>

        {/* Sensor markers */}
        {positioned.map((node) => (
          <SensorMarker key={node.sensorId} node={node} />
        ))}
      </div>
    </div>
  );
}

function SensorMarker({
  node,
}: {
  node: SensorNode & { x: number; y: number };
}) {
  const styles = STATE_STYLES[node.state];
  const isAlerting = node.state !== "normal";

  return (
    <div
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      <button
        type="button"
        className="relative flex flex-col items-center gap-1 focus-ring rounded-lg p-1"
        aria-label={`${node.sensorId}: ${styles.label}`}
      >
        <span className="relative flex h-4 w-4 items-center justify-center">
          {isAlerting && (
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full animate-ping",
                styles.ring
              )}
            />
          )}
          <span
            className={cn(
              "relative inline-flex h-3 w-3 rounded-full ring-2 ring-bg-card",
              styles.dot
            )}
          />
        </span>
        <span className="text-[10px] font-medium text-text-secondary whitespace-nowrap">
          {node.sensorId}
        </span>
      </button>

      {/* Hover/focus popover */}
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 bottom-full z-20 mb-1 -translate-x-1/2",
          "w-40 rounded-lg glass border border-glass-border p-2.5 shadow-lg",
          "opacity-0 transition-opacity duration-150",
          "group-hover:opacity-100 group-focus-within:opacity-100"
        )}
      >
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-text-primary">
            {node.sensorId}
          </span>
          <span className={cn("text-[10px] font-semibold uppercase", styles.text)}>
            {styles.label}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          {node.readings.map(({ reading, state }) => (
            <div
              key={reading.type}
              className="flex items-center justify-between text-[11px]"
            >
              <span className="text-text-muted">{formatType(reading.type)}</span>
              <span className={cn("font-medium", STATE_STYLES[state].text)}>
                {reading.value.toFixed(1)}
                {reading.unit}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-3">
      {(["normal", "warning", "critical"] as const).map((state) => (
        <div key={state} className="flex items-center gap-1">
          <span
            className={cn("h-2 w-2 rounded-full", STATE_STYLES[state].dot)}
          />
          <span className="text-[10px] text-text-muted">
            {STATE_STYLES[state].label}
          </span>
        </div>
      ))}
    </div>
  );
}
