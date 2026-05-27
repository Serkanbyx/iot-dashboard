import { cn } from "../../utils/cn";

type IndicatorStatus = "online" | "offline" | "warning";

interface LiveIndicatorProps {
  status: IndicatorStatus;
  className?: string;
}

const STATUS_CONFIG: Record<IndicatorStatus, { color: string; glow: boolean }> =
  {
    online: { color: "bg-accent-emerald", glow: true },
    warning: { color: "bg-accent-amber", glow: true },
    offline: { color: "bg-danger", glow: false },
  };

export default function LiveIndicator({
  status,
  className,
}: LiveIndicatorProps) {
  const { color, glow } = STATUS_CONFIG[status];

  return (
    <span
      className={cn("relative inline-flex h-4 w-4 items-center justify-center", className)}
      role="status"
      aria-label={`Connection ${status}`}
    >
      {/* Outer pulsing ring */}
      {glow && (
        <span
          className={cn(
            "absolute h-4 w-4 rounded-full opacity-30",
            "animate-[live-pulse_2s_ease-in-out_infinite]",
            color
          )}
        />
      )}
      {/* Inner solid dot */}
      <span className={cn("relative h-2 w-2 rounded-full", color)} />
    </span>
  );
}
