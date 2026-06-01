import { useMemo, useId } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  Brush,
  ResponsiveContainer,
} from "recharts";
import { BarChart3 } from "lucide-react";
import type {
  AggregatedReading,
  ThresholdConfig,
  SensorTypeValue,
} from "../../types";
import { COLOR_MAP } from "../dashboard/SensorSparkline";
import EmptyState from "../ui/EmptyState";


interface HistoricalChartProps {
  data: AggregatedReading[];
  threshold?: ThresholdConfig;
  sensorType: SensorTypeValue;
  loading: boolean;
}

interface ChartPoint {
  bucket: string;
  label: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
}

const TWO_DAYS_MS = 1000 * 60 * 60 * 48;

function makeFormatter(spanMs: number) {
  const longRange = spanMs > TWO_DAYS_MS;
  return (bucket: string) => {
    const date = new Date(bucket);
    if (longRange) {
      return date.toLocaleDateString("en-GB", {
        month: "2-digit",
        day: "2-digit",
      });
    }
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint; value: number }>;
  unit: string;
}

function CustomTooltip({ active, payload, unit }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const point = payload[0].payload as ChartPoint;
  const fullDate = new Date(point.bucket).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="glass rounded-lg border border-glass-border px-3 py-2 shadow-lg backdrop-blur-md">
      <p className="text-[10px] text-text-muted mb-1">{fullDate}</p>
      <div className="flex flex-col gap-0.5 text-xs">
        <span className="text-text-primary font-semibold">
          Avg: {point.avgValue.toFixed(1)}
          {unit}
        </span>
        <span className="text-accent-cyan">
          Min: {point.minValue.toFixed(1)}
          {unit}
        </span>
        <span className="text-accent-rose">
          Max: {point.maxValue.toFixed(1)}
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function HistoricalChart({
  data,
  threshold,
  sensorType,
  loading,
}: HistoricalChartProps) {
  const gradientId = useId();
  const hexColor = COLOR_MAP[sensorType] ?? "#3b82f6";
  const unit = threshold?.unit ?? "";

  const spanMs = useMemo(() => {
    if (data.length < 2) return 0;
    return (
      new Date(data[data.length - 1].bucket).getTime() -
      new Date(data[0].bucket).getTime()
    );
  }, [data]);

  const chartData = useMemo<ChartPoint[]>(() => {
    const formatter = makeFormatter(spanMs);
    return data.map((d) => ({
      bucket: d.bucket,
      label: formatter(d.bucket),
      avgValue: d.avgValue,
      minValue: d.minValue,
      maxValue: d.maxValue,
    }));
  }, [data, spanMs]);

  if (!loading && data.length === 0) {
    return (
      <div className="glass rounded-xl p-4 min-h-[400px] flex items-center justify-center">
        <EmptyState
          icon={BarChart3}
          title="No data for selected range"
          description="Try a different sensor, type, or date range."
        />
      </div>
    );
  }

  return (
    <div className="glass rounded-xl p-4 relative">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-bg-primary/50 backdrop-blur-sm">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent-blue border-t-transparent" />
        </div>
      )}

      <div style={{ height: 400 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 8, right: 12, bottom: 0, left: -8 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexColor} stopOpacity={0.2} />
                <stop offset="100%" stopColor={hexColor} stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="2 4"
              stroke="#64748b"
              opacity={0.12}
            />

            <XAxis
              dataKey="label"
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              minTickGap={40}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(v: number) => `${v.toFixed(0)}${unit}`}
            />

            <Tooltip
              content={<CustomTooltip unit={unit} />}
              cursor={{ stroke: hexColor, strokeOpacity: 0.3, strokeWidth: 1 }}
            />

            <Area
              type="monotone"
              dataKey="avgValue"
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

            <Brush
              dataKey="label"
              height={40}
              stroke={hexColor}
              fill="rgba(255,255,255,0.02)"
              travellerWidth={8}
              tickFormatter={() => ""}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
