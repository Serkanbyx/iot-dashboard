import { Search } from "lucide-react";
import { cn } from "../../utils/cn";

export interface AlertFilterValues {
  severity: string;
  sensorType: string;
  isAcknowledged: string;
  sensorId: string;
  sort: string;
}

interface AlertFilterBarProps {
  filters: AlertFilterValues;
  onChange: (key: keyof AlertFilterValues, value: string) => void;
}

interface SelectConfig {
  key: keyof AlertFilterValues;
  label: string;
  options: { value: string; label: string }[];
}

const SELECTS: SelectConfig[] = [
  {
    key: "severity",
    label: "Severity",
    options: [
      { value: "", label: "All" },
      { value: "WARNING", label: "Warning" },
      { value: "CRITICAL", label: "Critical" },
    ],
  },
  {
    key: "sensorType",
    label: "Type",
    options: [
      { value: "", label: "All" },
      { value: "TEMPERATURE", label: "Temperature" },
      { value: "HUMIDITY", label: "Humidity" },
      { value: "PRESSURE", label: "Pressure" },
    ],
  },
  {
    key: "isAcknowledged",
    label: "Status",
    options: [
      { value: "", label: "All" },
      { value: "false", label: "Unacknowledged" },
      { value: "true", label: "Acknowledged" },
    ],
  },
  {
    key: "sort",
    label: "Sort",
    options: [
      { value: "newest", label: "Newest" },
      { value: "oldest", label: "Oldest" },
      { value: "severity", label: "Severity" },
    ],
  },
];

const selectClass = cn(
  "h-9 rounded-lg px-3 text-sm",
  "bg-bg-elevated border border-glass-border text-text-primary",
  "outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
);

export default function AlertFilterBar({
  filters,
  onChange,
}: AlertFilterBarProps) {
  return (
    <div className="glass rounded-xl p-4 flex flex-wrap items-end gap-4">
      {SELECTS.map((select) => (
        <div key={select.key} className="flex flex-col gap-1.5">
          <label
            htmlFor={`alert-filter-${select.key}`}
            className="text-xs font-medium text-text-muted"
          >
            {select.label}
          </label>
          <select
            id={`alert-filter-${select.key}`}
            value={filters[select.key]}
            onChange={(e) => onChange(select.key, e.target.value)}
            className={selectClass}
          >
            {select.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Search */}
      <div className="flex flex-col gap-1.5 flex-1 min-w-[160px]">
        <label
          htmlFor="alert-filter-search"
          className="text-xs font-medium text-text-muted"
        >
          Search
        </label>
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            id="alert-filter-search"
            type="text"
            value={filters.sensorId}
            onChange={(e) => onChange("sensorId", e.target.value)}
            placeholder="Sensor ID..."
            className={cn(
              "h-9 w-full rounded-lg pl-9 pr-3 text-sm",
              "bg-bg-elevated border border-glass-border text-text-primary placeholder:text-text-muted",
              "outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
            )}
          />
        </div>
      </div>
    </div>
  );
}
