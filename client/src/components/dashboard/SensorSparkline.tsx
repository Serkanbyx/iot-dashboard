import { useMemo, useId } from "react";
import { AreaChart, Area, ResponsiveContainer } from "recharts";
import type { SensorReading } from "../../types";

const COLOR_MAP: Record<string, string> = {
  temperature: "#f43f5e",
  humidity: "#06b6d4",
  pressure: "#8b5cf6",
};

interface SensorSparklineProps {
  data: SensorReading[];
  color: string;
  height?: number;
  animate?: boolean;
}

export default function SensorSparkline({
  data,
  color,
  height = 40,
  animate = false,
}: SensorSparklineProps) {
  const gradientId = useId();

  const chartData = useMemo(() => {
    const sliced = data.slice(-10);

    if (sliced.length < 2) {
      const val = sliced[0]?.value ?? 0;
      return [
        { i: 0, value: val },
        { i: 1, value: val },
      ];
    }

    return sliced.map((r, i) => ({ i, value: r.value }));
  }, [data]);

  const resolvedColor = COLOR_MAP[color] ?? color;

  return (
    <div style={{ height }} className="-mx-1">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={resolvedColor} stopOpacity={0.2} />
              <stop offset="100%" stopColor={resolvedColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={resolvedColor}
            strokeOpacity={0.6}
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={animate}
            animationDuration={300}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export { COLOR_MAP };
