import { useMemo } from "react";
import { cn } from "../../utils/cn";

interface RangeVisualizerProps {
  criticalMin: number;
  minValue: number;
  maxValue: number;
  criticalMax: number;
  unit: string;
  currentValue?: number;
}

interface Segment {
  width: number;
  className: string;
}

interface Marker {
  left: number;
  value: number;
}

function toPercent(value: number, domainMin: number, span: number): number {
  if (span <= 0) return 0;
  return ((value - domainMin) / span) * 100;
}

export default function RangeVisualizer({
  criticalMin,
  minValue,
  maxValue,
  criticalMax,
  unit,
  currentValue,
}: RangeVisualizerProps) {
  const { segments, markers, currentLeft } = useMemo(() => {
    // Pad the domain so the outer critical zones are visible beyond the thresholds.
    const range = criticalMax - criticalMin || 1;
    const pad = range * 0.15;
    const domainMin = criticalMin - pad;
    const domainMax = criticalMax + pad;
    const span = domainMax - domainMin;

    const pct = (a: number, b: number) => ((b - a) / span) * 100;

    const segs: Segment[] = [
      { width: pct(domainMin, criticalMin), className: "bg-rose-500" },
      { width: pct(criticalMin, minValue), className: "bg-amber-500" },
      { width: pct(minValue, maxValue), className: "bg-emerald-500" },
      { width: pct(maxValue, criticalMax), className: "bg-amber-500" },
      { width: pct(criticalMax, domainMax), className: "bg-rose-500" },
    ];

    const mks: Marker[] = [
      { left: toPercent(criticalMin, domainMin, span), value: criticalMin },
      { left: toPercent(minValue, domainMin, span), value: minValue },
      { left: toPercent(maxValue, domainMin, span), value: maxValue },
      { left: toPercent(criticalMax, domainMin, span), value: criticalMax },
    ];

    let curLeft: number | null = null;
    if (typeof currentValue === "number") {
      const clamped = Math.min(Math.max(currentValue, domainMin), domainMax);
      curLeft = toPercent(clamped, domainMin, span);
    }

    return { segments: segs, markers: mks, currentLeft: curLeft };
  }, [criticalMin, minValue, maxValue, criticalMax, currentValue]);

  return (
    <div className="pt-1 pb-6">
      <div className="relative">
        {/* Gradient bar */}
        <div className="flex h-3 w-full overflow-hidden rounded-full">
          {segments.map((seg, i) => (
            <div
              key={i}
              className={seg.className}
              style={{ width: `${seg.width}%` }}
            />
          ))}
        </div>

        {/* Current value marker dot */}
        {currentLeft !== null && (
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-text-primary shadow-md"
            style={{ left: `${currentLeft}%` }}
            title={`Current: ${currentValue}${unit}`}
          />
        )}

        {/* Threshold markers + labels */}
        {markers.map((m, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2"
            style={{ left: `${m.left}%`, top: "100%" }}
          >
            <div
              className={cn(
                "mx-auto h-0 w-0 -mt-px",
                "border-x-4 border-x-transparent border-b-4 border-b-text-muted"
              )}
            />
            <span className="mt-0.5 block text-center text-[10px] text-text-muted whitespace-nowrap">
              {m.value}
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
