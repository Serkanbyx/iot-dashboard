import { useMemo } from "react";
import { cn } from "../../utils/cn";

export interface DateRange {
  start: string;
  stop: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  error?: string;
}

interface QuickOption {
  label: string;
  ms: number;
}

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const QUICK_OPTIONS: QuickOption[] = [
  { label: "1h", ms: HOUR },
  { label: "6h", ms: HOUR * 6 },
  { label: "24h", ms: DAY },
  { label: "3d", ms: DAY * 3 },
  { label: "7d", ms: DAY * 7 },
];

/** Convert an ISO string to a value usable by datetime-local inputs. */
function toLocalInput(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function fromLocalInput(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

export default function DateRangePicker({
  value,
  onChange,
  error,
}: DateRangePickerProps) {
  const activeQuick = useMemo(() => {
    if (!value.start || !value.stop) return null;
    const span = new Date(value.stop).getTime() - new Date(value.start).getTime();
    const match = QUICK_OPTIONS.find((o) => Math.abs(o.ms - span) < 1000 * 30);
    return match?.label ?? null;
  }, [value]);

  function handleQuickSelect(option: QuickOption) {
    const now = Date.now();
    onChange({
      start: new Date(now - option.ms).toISOString(),
      stop: new Date(now).toISOString(),
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Quick-select pills */}
      <div className="flex items-center gap-1.5">
        {QUICK_OPTIONS.map((option) => (
          <button
            key={option.label}
            type="button"
            onClick={() => handleQuickSelect(option)}
            className={cn(
              "px-2.5 py-1 rounded-full text-xs font-medium glass",
              "transition-colors duration-150",
              activeQuick === option.label
                ? "bg-accent-blue text-white"
                : "text-text-muted hover:text-text-secondary"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Datetime inputs */}
      <div className="flex items-center gap-2 flex-wrap">
        <input
          type="datetime-local"
          value={toLocalInput(value.start)}
          onChange={(e) =>
            onChange({ ...value, start: fromLocalInput(e.target.value) })
          }
          className={cn(
            "h-9 rounded-lg px-3 text-sm",
            "bg-bg-elevated border border-glass-border text-text-primary",
            "outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
          )}
          aria-label="Start date and time"
        />
        <span className="text-text-muted text-sm">to</span>
        <input
          type="datetime-local"
          value={toLocalInput(value.stop)}
          onChange={(e) =>
            onChange({ ...value, stop: fromLocalInput(e.target.value) })
          }
          className={cn(
            "h-9 rounded-lg px-3 text-sm",
            "bg-bg-elevated border border-glass-border text-text-primary",
            "outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
          )}
          aria-label="End date and time"
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
