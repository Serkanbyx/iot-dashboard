import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { WifiOff } from "lucide-react";
import type {
  SensorReading,
  ThresholdConfig,
  SensorTypeValue,
} from "../../types";
import SensorCard from "./SensorCard";
import EmptyState from "../ui/EmptyState";

interface SensorGridProps {
  readings: SensorReading[];
  history: Map<string, SensorReading[]>;
  thresholds: ThresholdConfig[];
  selectedFloor: string;
}

function readingKey(sensorId: string, type: string) {
  return `${sensorId}-${type}`;
}

const TYPE_ORDER: Record<SensorTypeValue, number> = {
  temperature: 0,
  humidity: 1,
  pressure: 2,
};

export default function SensorGrid({
  readings,
  history,
  thresholds,
  selectedFloor,
}: SensorGridProps) {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const sortedReadings = useMemo(() => {
    const filtered =
      selectedFloor === "all"
        ? readings
        : readings.filter((r) => r.floor === selectedFloor);

    return [...filtered].sort((a, b) => {
      if (a.sensorId !== b.sensorId) {
        return a.sensorId.localeCompare(b.sensorId);
      }
      return TYPE_ORDER[a.type] - TYPE_ORDER[b.type];
    });
  }, [readings, selectedFloor]);

  const thresholdByType = useMemo(() => {
    const map = new Map<string, ThresholdConfig>();
    for (const t of thresholds) {
      map.set(t.sensorType.toLowerCase(), t);
    }
    return map;
  }, [thresholds]);

  if (sortedReadings.length === 0) {
    return (
      <EmptyState
        icon={WifiOff}
        title="No sensors detected"
        description="Waiting for sensor data to arrive. Check your device connections."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortedReadings.map((reading, index) => {
        const key = readingKey(reading.sensorId, reading.type);
        const sensorHistory = history.get(key) ?? [];
        const threshold = thresholdByType.get(reading.type);
        const isExpanded = expandedCard === key;

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className={isExpanded ? "sm:col-span-2 lg:col-span-1" : undefined}
          >
            <SensorCard
              reading={reading}
              history={sensorHistory}
              threshold={threshold}
              isExpanded={isExpanded}
              onExpand={() =>
                setExpandedCard((prev) => (prev === key ? null : key))
              }
            />
          </motion.div>
        );
      })}
    </div>
  );
}
