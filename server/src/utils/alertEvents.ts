export function resolveCleanupDays(days: unknown): number {
  const parsed = Number(days);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 30;
  }
  return Math.min(365, Math.max(1, parsed));
}

export function buildAcknowledgedAlertsCleanupWhere(days: unknown): {
  createdAt: { lt: Date };
  isAcknowledged: true;
} {
  const safeDays = resolveCleanupDays(days);
  const cutoff = new Date(Date.now() - safeDays * 24 * 60 * 60 * 1000);

  return {
    createdAt: { lt: cutoff },
    isAcknowledged: true,
  };
}

export function buildAlertAcknowledgedPayload(
  alertId: string,
  acknowledgedBy: string
): { alertId: string; acknowledgedBy: string } {
  return { alertId, acknowledgedBy };
}

export function buildAlertBulkAcknowledgedPayload(
  acknowledgedBy: string,
  count: number
): { acknowledgedBy: string; count: number } {
  return { acknowledgedBy, count };
}

export function buildAlertNewPayload(alert: {
  id: string;
  sensorId: string;
  floor: string;
  sensorType: "TEMPERATURE" | "HUMIDITY" | "PRESSURE";
  value: number;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  direction: "ABOVE" | "BELOW";
  message: string;
  isAcknowledged: boolean;
  emailSent: boolean;
  createdAt: Date;
}) {
  return {
    id: alert.id,
    sensorId: alert.sensorId,
    floor: alert.floor,
    sensorType: alert.sensorType,
    value: alert.value,
    threshold: alert.threshold,
    severity: alert.severity,
    direction: alert.direction,
    message: alert.message,
    isAcknowledged: alert.isAcknowledged,
    emailSent: alert.emailSent,
    createdAt: alert.createdAt.toISOString(),
  };
}
