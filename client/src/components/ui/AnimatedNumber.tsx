import { useAnimatedValue } from "../../hooks/useAnimatedValue";
import { cn } from "../../utils/cn";

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  duration?: number;
  className?: string;
}

export default function AnimatedNumber({
  value,
  decimals = 1,
  duration = 300,
  className,
}: AnimatedNumberProps) {
  const animated = useAnimatedValue(value, duration);

  return (
    <span className={cn("tabular-nums", className)}>
      {animated.toFixed(decimals)}
    </span>
  );
}
