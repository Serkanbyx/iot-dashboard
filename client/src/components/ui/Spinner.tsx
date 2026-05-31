import { cn } from "../../utils/cn";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<SpinnerProps["size"]>, number> = {
  sm: 16,
  md: 24,
  lg: 40,
};

export default function Spinner({
  size = "md",
  color = "currentColor",
  className,
}: SpinnerProps) {
  const px = SIZE_MAP[size];
  const strokeWidth = size === "lg" ? 3 : 2.5;

  return (
    <svg
      className={cn("animate-spin", className)}
      width={px}
      height={px}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="status"
      aria-label="Loading"
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        className="opacity-20"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  );
}
