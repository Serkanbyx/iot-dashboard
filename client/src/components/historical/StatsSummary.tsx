import { useMemo } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  TrendingUp,
  Database,
} from "lucide-react";
import type { AggregatedReading } from "../../types";
import { cn } from "../../utils/cn";

interface StatsSummaryProps {
  data: AggregatedReading[];
  unit: string;
}

interface StatCard {
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  iconColor: string;
  borderColor: string;
  value: string;
}

export default function StatsSummary({ data, unit }: StatsSummaryProps) {
  const stats = useMemo<StatCard[]>(() => {
    const avgValues = data.map((d) => d.avgValue);
    const hasData = avgValues.length > 0;

    const min = hasData ? Math.min(...avgValues) : 0;
    const max = hasData ? Math.max(...avgValues) : 0;
    const mean = hasData
      ? avgValues.reduce((sum, v) => sum + v, 0) / avgValues.length
      : 0;

    return [
      {
        label: "Minimum",
        icon: ArrowDownCircle,
        iconColor: "text-accent-cyan",
        borderColor: "border-l-accent-cyan",
        value: hasData ? `${min.toFixed(1)}${unit}` : "—",
      },
      {
        label: "Maximum",
        icon: ArrowUpCircle,
        iconColor: "text-accent-rose",
        borderColor: "border-l-accent-rose",
        value: hasData ? `${max.toFixed(1)}${unit}` : "—",
      },
      {
        label: "Average",
        icon: TrendingUp,
        iconColor: "text-accent-emerald",
        borderColor: "border-l-accent-emerald",
        value: hasData ? `${mean.toFixed(1)}${unit}` : "—",
      },
      {
        label: "Data Points",
        icon: Database,
        iconColor: "text-accent-violet",
        borderColor: "border-l-accent-violet",
        value: String(data.length),
      },
    ];
  }, [data, unit]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "glass rounded-xl p-4 border-l-2",
            stat.borderColor
          )}
        >
          <div className="flex items-center gap-2">
            <stat.icon size={20} className={stat.iconColor} />
            <span className="text-xs text-text-muted">{stat.label}</span>
          </div>
          <p className="text-2xl font-bold mt-2">{stat.value}</p>
        </div>
      ))}
    </div>
  );
}
