import type { ThresholdConfig } from "../types";

export type AlertState = "normal" | "warning" | "critical";

export const ALERT_PRIORITY: Record<AlertState, number> = {
  normal: 0,
  warning: 1,
  critical: 2,
};

export function getAlertState(
  value: number,
  threshold?: ThresholdConfig
): AlertState {
  if (!threshold || !threshold.isActive) return "normal";
  if (value <= threshold.criticalMin || value >= threshold.criticalMax)
    return "critical";
  if (value <= threshold.minValue || value >= threshold.maxValue)
    return "warning";
  return "normal";
}

export function worstState(states: AlertState[]): AlertState {
  return states.reduce<AlertState>(
    (worst, current) =>
      ALERT_PRIORITY[current] > ALERT_PRIORITY[worst] ? current : worst,
    "normal"
  );
}
