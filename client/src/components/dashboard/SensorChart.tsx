import { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import type { SensorReading, ThresholdConfig, SensorTypeValue } from "../../types";
import { COLOR_MAP } from "./SensorSparkline";
import { cn } from "../../utils/cn";

interface SensorChartProps {
  data: SensorReading[];
  threshold?: ThresholdConfig;
  sensorType: SensorTypeValue;
  height?: number;
}

interface ChartPoint {
  time: string;
  value: number;
  unit: string;
}

const CHART_CAP = 60;

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getStatus(
  value: number,
  threshold?: ThresholdConfig
): { label: string; className: string } {
  if (!threshold || !threshold.isActive)
    return { label: "Normal", className: "text-success" };
  if (value <= threshold.criticalMin || value >= threshold.criticalMax)
    return { label: "Critical", className: "text-danger" };
  if (value <= threshold.minValue || value >= threshold.maxValue)
    return { label: "Warning", className: "text-warning" };
  return { label: "Normal", className: "text-success" };
}

function CustomTooltip({
  active,
  payload,
  threshold,
}: TooltipProps<number, string> & { threshold?: ThresholdConfig }) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload as ChartPoint;
  const status = getStatus(point.value, threshold);

  return (
    <div className="glass rounded-lg border border-glass-border px-3 py-2 shadow-lg backdrop-blur-md">
      <p className="text-[10px] text-text-muted mb-0.5">{point.time}</p>
      <p className="text-sm font-bold text-text-primary">
        {point.value.toFixed(1)}
        <span className="text-xs text-text-secondary ml-1">{point.unit}</span>
      </p>
      <p className={cn("text-[10px] font-semibold uppercase", status.className)}>
        {status.label}
      </p>
    </div>
  );
}

export default function SensorChart({
  data,
  threshold,
  sensorType,
  height = 200,
}: SensorChartProps) {
  const gradientId = useId();
  const hexColor = COLOR_MAP[sensorType] ?? "#3b82f6";

  const chartData = useMemo<ChartPoint[]>(
    () =>
      data.slice(-CHART_CAP).map((r) => ({
        time: formatTime(r.timestamp),
        value: r.value,
        unit: r.unit,
      })),
    [data]
  );

  const yDomain = useMemo<[number, number]>(() => {
    const values = chartData.map((d) => d.value);
    if (threshold) {
      values.push(threshold.criticalMin, threshold.criticalMax);
    }
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }, [chartData, threshold]);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={chartData}
          margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hexColor} stopOpacity={0.15} />
              <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#64748b" opacity={0.1} />

          <XAxis
            dataKey="time"
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            minTickGap={32}
          />
          <YAxis
            domain={yDomain}
            tick={{ fill: "#64748b", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={(v: number) => v.toFixed(0)}
          />

          <Tooltip
            content={<CustomTooltip threshold={threshold} />}
            cursor={{ stroke: hexColor, strokeOpacity: 0.3, strokeWidth: 1 }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke={hexColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={false}
            animationDuration={300}
          />

          {threshold && threshold.isActive && (
            <>
              <ReferenceLine
                y={threshold.maxValue}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{
                  value: "Max",
                  position: "insideTopRight",
                  fill: "#f59e0b",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={threshold.criticalMax}
                stroke="#f43f5e"
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{
                  value: "Critical",
                  position: "insideTopRight",
                  fill: "#f43f5e",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={threshold.minValue}
                stroke="#f59e0b"
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{
                  value: "Min",
                  position: "insideBottomRight",
                  fill: "#f59e0b",
                  fontSize: 10,
                }}
              />
              <ReferenceLine
                y={threshold.criticalMin}
                stroke="#f43f5e"
                strokeDasharray="5 5"
                strokeOpacity={0.7}
                label={{
                  value: "Critical",
                  position: "insideBottomRight",
                  fill: "#f43f5e",
                  fontSize: 10,
                }}
              />
            </>
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
