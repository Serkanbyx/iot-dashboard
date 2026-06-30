import type { Server } from "socket.io";
import prisma from "../config/database.js";
import { sendAlertNotifications } from "./notificationService.js";
import { buildAlertNewPayload } from "../utils/alertEvents.js";
import type { SensorReading } from "../types/sensor.js";

interface ThresholdEntry {
  minValue: number;
  maxValue: number;
  criticalMin: number;
  criticalMax: number;
  unit: string;
  isActive: boolean;
}

export interface ThresholdEvaluation {
  severity: SeverityLevel;
  direction: DirectionLevel;
  thresholdValue: number;
}

export function evaluateReadingAgainstThreshold(
  value: number,
  threshold: ThresholdEntry
): ThresholdEvaluation | null {
  if (!threshold.isActive) return null;

  if (value > threshold.criticalMax) {
    return {
      severity: "CRITICAL",
      direction: "ABOVE",
      thresholdValue: threshold.criticalMax,
    };
  }

  if (value < threshold.criticalMin) {
    return {
      severity: "CRITICAL",
      direction: "BELOW",
      thresholdValue: threshold.criticalMin,
    };
  }

  if (value > threshold.maxValue) {
    return {
      severity: "WARNING",
      direction: "ABOVE",
      thresholdValue: threshold.maxValue,
    };
  }

  if (value < threshold.minValue) {
    return {
      severity: "WARNING",
      direction: "BELOW",
      thresholdValue: threshold.minValue,
    };
  }

  return null;
}

type SeverityLevel = "WARNING" | "CRITICAL";
type DirectionLevel = "ABOVE" | "BELOW";

const CACHE_TTL_MS = 60 * 1000;
const DEDUP_WINDOW_MS = 60 * 1000;

const globalThresholdCache = new Map<string, ThresholdEntry>();
const deviceThresholdCache = new Map<string, ThresholdEntry>();
let lastCacheRefresh = 0;

function cacheKey(sensorId: string, sensorType: string): string {
  return `${sensorId}:${sensorType}`;
}

async function loadThresholds(): Promise<void> {
  const configs = await prisma.thresholdConfig.findMany();

  globalThresholdCache.clear();
  deviceThresholdCache.clear();

  for (const config of configs) {
    const entry: ThresholdEntry = {
      minValue: config.minValue,
      maxValue: config.maxValue,
      criticalMin: config.criticalMin,
      criticalMax: config.criticalMax,
      unit: config.unit,
      isActive: config.isActive,
    };

    if (config.sensorId) {
      deviceThresholdCache.set(
        cacheKey(config.sensorId, config.sensorType),
        entry
      );
    } else {
      globalThresholdCache.set(config.sensorType, entry);
    }
  }

  lastCacheRefresh = Date.now();
  console.log(
    `[ALERT] Threshold cache loaded (${globalThresholdCache.size} global, ${deviceThresholdCache.size} device overrides)`
  );
}

export async function reloadThresholdCache(): Promise<void> {
  await loadThresholds();
}

function resolveThreshold(
  sensorId: string,
  enumType: "TEMPERATURE" | "HUMIDITY" | "PRESSURE"
): ThresholdEntry | undefined {
  return (
    deviceThresholdCache.get(cacheKey(sensorId, enumType)) ??
    globalThresholdCache.get(enumType)
  );
}

function mapSensorTypeToEnum(type: string): "TEMPERATURE" | "HUMIDITY" | "PRESSURE" {
  return type.toUpperCase() as "TEMPERATURE" | "HUMIDITY" | "PRESSURE";
}

export async function processReading(reading: SensorReading, io: Server): Promise<void> {
  if (Date.now() - lastCacheRefresh > CACHE_TTL_MS) {
    await loadThresholds();
  }

  const enumType = mapSensorTypeToEnum(reading.type);
  const threshold = resolveThreshold(reading.sensorId, enumType);

  if (!threshold || !threshold.isActive) return;

  const evaluation = evaluateReadingAgainstThreshold(reading.value, threshold);
  if (!evaluation) return;

  const { severity, direction, thresholdValue } = evaluation;

  const recentAlert = await prisma.alert.findFirst({
    where: {
      sensorId: reading.sensorId,
      sensorType: enumType,
      isAcknowledged: false,
      createdAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
  });

  if (recentAlert) return;

  const message = `${reading.type} ${direction === "ABOVE" ? "exceeded" : "fell below"} ${severity.toLowerCase()} threshold: ${reading.value}${threshold.unit} (limit: ${thresholdValue}${threshold.unit})`;

  const alert = await prisma.alert.create({
    data: {
      sensorId: reading.sensorId,
      floor: reading.floor,
      sensorType: enumType,
      value: reading.value,
      threshold: thresholdValue,
      severity,
      direction,
      message,
    },
  });

  io.to("dashboard").emit("alert:new", buildAlertNewPayload(alert));

  console.log(`[ALERT] ${severity} — ${message}`);

  if (severity === "CRITICAL") {
    const notifications = await sendAlertNotifications({
      sensorId: reading.sensorId,
      floor: reading.floor,
      sensorType: reading.type,
      value: reading.value,
      unit: threshold.unit,
      threshold: thresholdValue,
      severity,
      direction,
      message,
    });

    if (notifications.email || notifications.slack || notifications.webhook) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { emailSent: true },
      });
    }
  }
}
