import { cn } from "../../utils/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "card";
}

const VARIANT_MAP: Record<NonNullable<SkeletonProps["variant"]>, string> = {
  text: "h-4 rounded",
  circular: "rounded-full",
  card: "h-48 rounded-2xl",
};

export default function Skeleton({
  className,
  variant = "text",
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-shimmer bg-bg-elevated bg-size-[200%_100%]",
        VARIANT_MAP[variant],
        className
      )}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, var(--shimmer-streak, rgba(255,255,255,0.06)) 40%, transparent 80%)",
        backgroundSize: "200% 100%",
        backgroundColor: "var(--color-bg-elevated)",
      }}
    />
  );
}
