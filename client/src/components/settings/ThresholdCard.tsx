import { useMemo, useState } from "react";
import { Thermometer, Droplets, Gauge, Save, Loader2 } from "lucide-react";
import type { ThresholdConfig } from "../../types";
import RangeVisualizer from "./RangeVisualizer";
import { cn } from "../../utils/cn";

export interface ThresholdFormValues {
  criticalMin: number;
  minValue: number;
  maxValue: number;
  criticalMax: number;
}

interface ThresholdCardProps {
  config: ThresholdConfig;
  saving: boolean;
  toggling: boolean;
  readOnly?: boolean;
  onSave: (sensorType: string, values: ThresholdFormValues, sensorId?: string) => void;
  onToggleActive: (sensorType: string, isActive: boolean, sensorId?: string) => void;
  onDelete?: () => void;
  deleting?: boolean;
}

const TYPE_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
  }
> = {
  TEMPERATURE: { label: "Temperature", icon: Thermometer, color: "text-sensor-temperature" },
  HUMIDITY: { label: "Humidity", icon: Droplets, color: "text-sensor-humidity" },
  PRESSURE: { label: "Pressure", icon: Gauge, color: "text-sensor-pressure" },
};

const FIELDS: { key: keyof ThresholdFormValues; label: string }[] = [
  { key: "criticalMin", label: "Critical Min" },
  { key: "minValue", label: "Warning Min" },
  { key: "maxValue", label: "Warning Max" },
  { key: "criticalMax", label: "Critical Max" },
];

function validate(values: ThresholdFormValues): string | null {
  const { criticalMin, minValue, maxValue, criticalMax } = values;
  if (criticalMin >= minValue) return "Critical min must be below warning min.";
  if (minValue >= maxValue) return "Warning min must be below warning max.";
  if (maxValue >= criticalMax) return "Warning max must be below critical max.";
  return null;
}

export default function ThresholdCard({
  config,
  saving,
  toggling,
  readOnly = false,
  onSave,
  onToggleActive,
  onDelete,
  deleting = false,
}: ThresholdCardProps) {
  const meta = TYPE_CONFIG[config.sensorType] ?? {
    label: config.sensorType,
    icon: Gauge,
    color: "text-text-secondary",
  };
  const Icon = meta.icon;

  const configKey = `${config.criticalMin}:${config.minValue}:${config.maxValue}:${config.criticalMax}`;

  const [values, setValues] = useState<ThresholdFormValues>({
    criticalMin: config.criticalMin,
    minValue: config.minValue,
    maxValue: config.maxValue,
    criticalMax: config.criticalMax,
  });

  const [prevKey, setPrevKey] = useState(configKey);
  if (configKey !== prevKey) {
    setPrevKey(configKey);
    setValues({
      criticalMin: config.criticalMin,
      minValue: config.minValue,
      maxValue: config.maxValue,
      criticalMax: config.criticalMax,
    });
  }

  const error = useMemo(() => validate(values), [values]);

  const isDirty = useMemo(
    () =>
      values.criticalMin !== config.criticalMin ||
      values.minValue !== config.minValue ||
      values.maxValue !== config.maxValue ||
      values.criticalMax !== config.criticalMax,
    [values, config]
  );

  function handleChange(key: keyof ThresholdFormValues, raw: string) {
    setValues((prev) => ({ ...prev, [key]: raw === "" ? 0 : Number(raw) }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (readOnly || error || !isDirty || saving) return;
    onSave(config.sensorType, values, config.sensorId);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="glass rounded-2xl p-5 flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className={cn("flex items-center justify-center h-9 w-9 rounded-lg glass", meta.color)}>
            <Icon size={20} />
          </div>
          <h2 className="text-base font-semibold text-text-primary">
            {meta.label}
            {config.sensorId ? (
              <span className="ml-2 text-xs font-normal text-text-muted">
                ({config.sensorId})
              </span>
            ) : null}
          </h2>
        </div>

        {/* Active toggle (auto-saves) */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-muted">
            {config.isActive ? "Active" : "Inactive"}
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={config.isActive}
            aria-label={`Toggle ${meta.label} monitoring`}
            disabled={toggling || readOnly}
            onClick={() =>
              !readOnly &&
              onToggleActive(config.sensorType, !config.isActive, config.sensorId)
            }
            className={cn(
              "relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0",
              "disabled:opacity-50 disabled:pointer-events-none",
              config.isActive ? "bg-accent-blue" : "bg-bg-elevated"
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm",
                "transition-transform duration-200",
                config.isActive && "translate-x-5"
              )}
            />
          </button>
        </div>
      </div>

      {/* Threshold zone visualization (live preview from current form values) */}
      <RangeVisualizer
        criticalMin={values.criticalMin}
        minValue={values.minValue}
        maxValue={values.maxValue}
        criticalMax={values.criticalMax}
        unit={config.unit}
      />

      {/* 2x2 form grid */}
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <label key={field.key} className="flex flex-col gap-1.5">
            <span className="text-xs text-text-muted">{field.label}</span>
            <div className="relative">
              <input
                type="number"
                step="any"
                value={values[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                disabled={readOnly}
                className={cn(
                  "w-full h-9 px-3 pr-10 rounded-lg bg-bg-elevated border outline-none",
                  "text-text-primary transition-colors",
                  "disabled:opacity-60 disabled:cursor-not-allowed",
                  error
                    ? "border-danger/50 focus:border-danger"
                    : "border-glass-border focus:border-accent-blue"
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted pointer-events-none">
                {config.unit}
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Validation error */}
      {error && <p className="text-xs text-danger">{error}</p>}

      {/* Save */}
      {!readOnly && (
        <div className="flex justify-end gap-2">
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className={cn(
                "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold",
                "text-danger border border-danger/30 hover:bg-danger/10",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              Remove Override
            </button>
          )}
          <button
            type="submit"
            disabled={!!error || !isDirty || saving}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-lg text-sm font-semibold text-white",
              "bg-accent-blue hover:bg-accent-blue/90 transition-colors duration-150",
              "disabled:opacity-50 disabled:pointer-events-none"
            )}
          >
            {saving ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Save size={16} />
            )}
            Save Changes
          </button>
        </div>
      )}
    </form>
  );
}
