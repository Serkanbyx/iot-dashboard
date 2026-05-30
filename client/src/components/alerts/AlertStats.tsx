import type { AlertStats as AlertStatsData } from "../../types";
import { cn } from "../../utils/cn";

interface AlertStatsProps {
  stats: AlertStatsData | null;
}

interface StatBadge {
  label: string;
  value: number;
  dotColor: string;
  textColor: string;
  pulse: boolean;
}

export default function AlertStats({ stats }: AlertStatsProps) {
  if (!stats) return null;

  const criticalCount = stats.bySeverity?.CRITICAL ?? 0;

  const badges: StatBadge[] = [
    {
      label: "Total",
      value: stats.total,
      dotColor: "bg-text-muted",
      textColor: "text-text-secondary",
      pulse: false,
    },
    {
      label: "Unacknowledged",
      value: stats.unacknowledged,
      dotColor: "bg-warning",
      textColor: "text-warning",
      pulse: stats.unacknowledged > 0,
    },
    {
      label: "Critical",
      value: criticalCount,
      dotColor: "bg-danger",
      textColor: "text-danger",
      pulse: criticalCount > 0,
    },
    {
      label: "Last 24h",
      value: stats.last24h,
      dotColor: "bg-accent-cyan",
      textColor: "text-accent-cyan",
      pulse: false,
    },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      {badges.map((badge) => (
        <div
          key={badge.label}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full glass"
        >
          <span className="relative flex h-2.5 w-2.5">
            {badge.pulse && (
              <span
                className={cn(
                  "absolute inline-flex h-full w-full rounded-full opacity-75",
                  "animate-ping",
                  badge.dotColor
                )}
              />
            )}
            <span
              className={cn(
                "relative inline-flex h-2.5 w-2.5 rounded-full",
                badge.dotColor
              )}
            />
          </span>
          <span className={cn("text-lg font-bold", badge.textColor)}>
            {badge.value}
          </span>
          <span className="text-xs text-text-muted">{badge.label}</span>
        </div>
      ))}
    </div>
  );
}
