import { useId } from "react";
import { motion } from "framer-motion";
import { cn } from "../../utils/cn";

interface SegmentOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  const layoutId = useId();

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-lg p-1 glass",
        className
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "relative px-3 py-1.5 rounded-md text-sm font-medium z-10",
              "transition-colors duration-150",
              isActive
                ? "text-white"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {isActive && (
              <motion.span
                layoutId={layoutId}
                className="absolute inset-0 rounded-md bg-accent-blue"
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
              />
            )}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
