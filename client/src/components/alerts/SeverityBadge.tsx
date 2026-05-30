import { cn } from "../../utils/cn";

type Severity = "WARNING" | "CRITICAL";

interface SeverityBadgeProps {
  severity: Severity;
  className?: string;
}

export default function SeverityBadge({
  severity,
  className,
}: SeverityBadgeProps) {
  const isCritical = severity === "CRITICAL";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2 py-0.5 rounded-full",
        "text-[10px] font-bold uppercase tracking-wider",
        isCritical
          ? "bg-danger/20 text-danger"
          : "bg-warning/20 text-warning",
        className
      )}
    >
      {isCritical && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full rounded-full bg-danger opacity-75 animate-ping" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-danger" />
        </span>
      )}
      {severity}
    </span>
  );
}
