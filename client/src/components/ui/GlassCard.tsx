import type { ReactNode } from "react";
import { cn } from "../../utils/cn";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  glow?: "blue" | "emerald" | "violet" | "rose" | "amber";
}

const PADDING_MAP: Record<NonNullable<GlassCardProps["padding"]>, string> = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-7",
};

const GLOW_MAP: Record<NonNullable<GlassCardProps["glow"]>, string> = {
  blue: "shadow-[0_0_24px_-4px_rgba(59,130,246,0.25)]",
  emerald: "shadow-[0_0_24px_-4px_rgba(16,185,129,0.25)]",
  violet: "shadow-[0_0_24px_-4px_rgba(139,92,246,0.25)]",
  rose: "shadow-[0_0_24px_-4px_rgba(244,63,94,0.25)]",
  amber: "shadow-[0_0_24px_-4px_rgba(245,158,11,0.25)]",
};

export default function GlassCard({
  children,
  className,
  padding = "md",
  glow,
}: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl glass border border-glass-border",
        "transition-[border-color] duration-200 hover:border-glass-border/80",
        PADDING_MAP[padding],
        glow && GLOW_MAP[glow],
        className
      )}
    >
      {children}
    </div>
  );
}
