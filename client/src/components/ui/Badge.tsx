import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

type BadgeVariant = "info" | "success" | "warning" | "danger" | "violet";

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  pulse?: boolean;
  className?: string;
}

const VARIANT_MAP: Record<BadgeVariant, { bg: string; text: string; pulseBg: string }> = {
  info: { bg: "bg-accent-blue/15", text: "text-accent-blue", pulseBg: "bg-accent-blue" },
  success: { bg: "bg-success/15", text: "text-success", pulseBg: "bg-success" },
  warning: { bg: "bg-warning/15", text: "text-warning", pulseBg: "bg-warning" },
  danger: { bg: "bg-danger/15", text: "text-danger", pulseBg: "bg-danger" },
  violet: { bg: "bg-accent-violet/15", text: "text-accent-violet", pulseBg: "bg-accent-violet" },
};

export default function Badge({
  variant,
  children,
  pulse = false,
  className,
}: BadgeProps) {
  const styles = VARIANT_MAP[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full",
        "text-[11px] font-semibold leading-tight",
        styles.bg,
        styles.text,
        className
      )}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              styles.pulseBg
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              styles.pulseBg
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
