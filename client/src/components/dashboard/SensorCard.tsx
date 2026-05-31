import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, Droplets, Gauge, ChevronDown } from "lucide-react";
import type { SensorReading, ThresholdConfig, SensorTypeValue } from "../../types";
import AnimatedNumber from "../ui/AnimatedNumber";
import SensorSparkline from "./SensorSparkline";
import SensorChart from "./SensorChart";
import { cn } from "../../utils/cn";

interface SensorCardProps {
  reading: SensorReading;
  history: SensorReading[];
  threshold?: ThresholdConfig;
  isExpanded: boolean;
  onExpand: () => void;
}

type AlertState = "normal" | "warning" | "critical";

const SENSOR_CONFIG: Record<
  SensorTypeValue,
  {
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    fill: string;
    stroke: string;
  }
> = {
  temperature: {
    icon: Thermometer,
    color: "text-sensor-temperature",
    fill: "rgba(244, 63, 94, 0.1)",
    stroke: "rgba(244, 63, 94, 0.6)",
  },
  humidity: {
    icon: Droplets,
    color: "text-sensor-humidity",
    fill: "rgba(6, 182, 212, 0.1)",
    stroke: "rgba(6, 182, 212, 0.6)",
  },
  pressure: {
    icon: Gauge,
    color: "text-sensor-pressure",
    fill: "rgba(139, 92, 246, 0.1)",
    stroke: "rgba(139, 92, 246, 0.6)",
  },
};

const ALERT_STYLES: Record<
  AlertState,
  { border: string; glow: string; bg: string }
> = {
  normal: { border: "border-glass-border", glow: "", bg: "" },
  warning: {
    border: "border-amber-500/30",
    glow: "glow-amber",
    bg: "bg-amber-500/5",
  },
  critical: {
    border: "border-rose-500/50",
    glow: "glow-rose",
    bg: "bg-rose-500/10",
  },
};

function getAlertState(
  value: number,
  threshold?: ThresholdConfig
): AlertState {
  if (!threshold || !threshold.isActive) return "normal";
  if (value <= threshold.criticalMin || value >= threshold.criticalMax)
    return "critical";
  if (value <= threshold.minValue || value >= threshold.maxValue)
    return "warning";
  return "normal";
}

function useRelativeTime(timestamp: string) {
  const [text, setText] = useState("");

  useEffect(() => {
    function update() {
      const diff = Math.floor(
        (Date.now() - new Date(timestamp).getTime()) / 1000
      );
      if (diff < 5) setText("just now");
      else if (diff < 60) setText(`${diff}s ago`);
      else if (diff < 3600) setText(`${Math.floor(diff / 60)}m ago`);
      else setText(`${Math.floor(diff / 3600)}h ago`);
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);

  return text;
}

export default function SensorCard({
  reading,
  history,
  threshold,
  isExpanded,
  onExpand,
}: SensorCardProps) {
  const config = SENSOR_CONFIG[reading.type];
  const Icon = config.icon;
  const alertState = getAlertState(reading.value, threshold);
  const styles = ALERT_STYLES[alertState];
  const relativeTime = useRelativeTime(reading.timestamp);

  return (
    <motion.div
      layout
      className={cn(
        "rounded-2xl glass border p-4 cursor-pointer",
        "transition-all duration-200",
        "hover:border-accent-blue/20",
        styles.border,
        styles.glow,
        styles.bg,
        alertState === "critical" && "animate-pulse-slow"
      )}
      onClick={onExpand}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={18} className={config.color} />
          <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
            {reading.type}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-text-muted">{reading.sensorId}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-bg-elevated text-text-muted">
            {reading.floor}
          </span>
        </div>
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1 mb-3">
        <AnimatedNumber
          value={reading.value}
          className={cn("text-4xl font-bold", config.color)}
        />
        <span className="text-sm text-text-secondary">{reading.unit}</span>
      </div>

      {/* Sparkline */}
      {history.length > 0 && (
        <div className="mb-3">
          <SensorSparkline
            data={history}
            color={reading.type}
            animate={false}
          />
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">{relativeTime}</span>
          {alertState !== "normal" && (
            <span
              className={cn(
                "text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase",
                alertState === "critical"
                  ? "bg-danger/20 text-danger"
                  : "bg-warning/20 text-warning"
              )}
            >
              {alertState}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onExpand();
          }}
          className="p-1 rounded text-text-muted hover:text-text-secondary transition-colors"
          aria-label={isExpanded ? "Collapse card" : "Expand card"}
        >
          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="block"
          >
            <ChevronDown size={16} />
          </motion.span>
        </button>
      </div>

      {/* Expanded chart */}
      <AnimatePresence>
        {isExpanded && history.length > 1 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden mt-3 pt-3 border-t border-glass-border"
          >
            <SensorChart
              data={history}
              threshold={threshold}
              sensorType={reading.type}
              height={200}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
