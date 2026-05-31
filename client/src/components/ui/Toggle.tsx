import { cn } from "../../utils/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
}

export default function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 rounded-full",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue",
        "disabled:opacity-50 disabled:pointer-events-none",
        checked ? "bg-accent-blue" : "bg-bg-elevated",
        className
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm",
          "transform transition-transform duration-200 ease-in-out",
          "translate-y-0.5",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
      />
    </button>
  );
}
