import { Search, Loader2 } from "lucide-react";
import type { SensorInfo, SensorTypeValue } from "../../types";
import SegmentedControl from "../ui/SegmentedControl";
import DateRangePicker, { type DateRange } from "./DateRangePicker";
import { cn } from "../../utils/cn";

type AggregationWindow = "minute" | "hour";

interface FilterBarProps {
  sensors: SensorInfo[];
  selectedSensor: string;
  selectedType: SensorTypeValue;
  dateRange: DateRange;
  window: AggregationWindow;
  loading: boolean;
  rangeError?: string;
  onSensorChange: (sensorId: string) => void;
  onTypeChange: (type: SensorTypeValue) => void;
  onDateRangeChange: (range: DateRange) => void;
  onWindowChange: (window: AggregationWindow) => void;
  onLoad: () => void;
}

const TYPE_OPTIONS: { value: SensorTypeValue; label: string }[] = [
  { value: "temperature", label: "Temp" },
  { value: "humidity", label: "Humid" },
  { value: "pressure", label: "Pressure" },
];

const WINDOW_OPTIONS: { value: AggregationWindow; label: string }[] = [
  { value: "minute", label: "Minute" },
  { value: "hour", label: "Hour" },
];

export default function FilterBar({
  sensors,
  selectedSensor,
  selectedType,
  dateRange,
  window,
  loading,
  rangeError,
  onSensorChange,
  onTypeChange,
  onDateRangeChange,
  onWindowChange,
  onLoad,
}: FilterBarProps) {
  const canLoad = Boolean(selectedSensor) && !rangeError && !loading;

  return (
    <div className="glass rounded-xl p-4 flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-4">
        {/* Sensor select */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="sensor-select"
            className="text-xs font-medium text-text-muted"
          >
            Sensor
          </label>
          <select
            id="sensor-select"
            value={selectedSensor}
            onChange={(e) => onSensorChange(e.target.value)}
            className={cn(
              "h-9 rounded-lg px-3 text-sm min-w-[180px]",
              "bg-bg-elevated border border-glass-border text-text-primary",
              "outline-none focus:ring-2 focus:ring-accent-blue focus:border-accent-blue"
            )}
          >
            {sensors.length === 0 && <option value="">No sensors</option>}
            {sensors.map((sensor) => (
              <option key={sensor.sensorId} value={sensor.sensorId}>
                {sensor.sensorId} ({sensor.floor})
              </option>
            ))}
          </select>
        </div>

        {/* Type segmented group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Type</span>
          <SegmentedControl
            options={TYPE_OPTIONS}
            value={selectedType}
            onChange={onTypeChange}
          />
        </div>

        {/* Window segmented group */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">Window</span>
          <SegmentedControl
            options={WINDOW_OPTIONS}
            value={window}
            onChange={onWindowChange}
          />
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        {/* Date range */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-muted">
            Date Range
          </span>
          <DateRangePicker
            value={dateRange}
            onChange={onDateRangeChange}
            error={rangeError}
          />
        </div>

        {/* Load button */}
        <button
          type="button"
          onClick={onLoad}
          disabled={!canLoad}
          className={cn(
            "flex items-center gap-2 h-10 px-5 rounded-lg font-semibold text-white",
            "bg-linear-to-r from-accent-blue to-accent-violet",
            "transition-all duration-200 hover:shadow-lg hover:shadow-accent-blue/25",
            "disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Search size={16} />
          )}
          Load Data
        </button>
      </div>
    </div>
  );
}
