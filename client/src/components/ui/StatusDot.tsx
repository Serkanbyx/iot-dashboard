import { cn } from "../../utils/cn";

type Status = "online" | "offline" | "warning";

interface StatusDotProps {
  status: Status;
  pulse?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const COLOR_MAP: Record<Status, string> = {
  online: "bg-success",
  offline: "bg-danger",
  warning: "bg-warning",
};

const PULSE_COLOR_MAP: Record<Status, string> = {
  online: "bg-success",
  offline: "bg-danger",
  warning: "bg-warning",
};

const SIZE_MAP: Record<NonNullable<StatusDotProps["size"]>, { dot: string; ring: string }> = {
  sm: { dot: "h-2 w-2", ring: "h-2 w-2" },
  md: { dot: "h-2.5 w-2.5", ring: "h-2.5 w-2.5" },
};

export default function StatusDot({
  status,
  pulse = false,
  size = "sm",
  className,
}: StatusDotProps) {
  const dims = SIZE_MAP[size];

  return (
    <span className={cn("relative inline-flex", dims.dot, className)}>
      {pulse && (
        <span
          className={cn(
            "absolute inset-0 rounded-full opacity-75 animate-ping",
            PULSE_COLOR_MAP[status]
          )}
        />
      )}
      <span
        className={cn(
          "relative inline-flex rounded-full",
          dims.dot,
          COLOR_MAP[status]
        )}
      />
    </span>
  );
}
