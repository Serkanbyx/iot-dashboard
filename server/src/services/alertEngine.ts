import type { Server } from "socket.io";
import prisma from "../config/database.js";
import { sendAlertEmail } from "./emailService.js";
import type { SensorReading } from "../types/sensor.js";

interface ThresholdEntry {
  minValue: number;
  maxValue: number;
  criticalMin: number;
  criticalMax: number;
  unit: string;
  isActive: boolean;
}

type SeverityLevel = "WARNING" | "CRITICAL";
type DirectionLevel = "ABOVE" | "BELOW";

const CACHE_TTL_MS = 60 * 1000; // refresh every 60 seconds
const DEDUP_WINDOW_MS = 60 * 1000; // skip if same alert within 60 seconds

const thresholdCache = new Map<string, ThresholdEntry>();
let lastCacheRefresh = 0;

async function loadThresholds(): Promise<void> {
  const configs = await prisma.thresholdConfig.findMany();

  thresholdCache.clear();
  for (const c of configs) {
    thresholdCache.set(c.sensorType, {
      minValue: c.minValue,
      maxValue: c.maxValue,
      criticalMin: c.criticalMin,
      criticalMax: c.criticalMax,
      unit: c.unit,
      isActive: c.isActive,
    });
  }

  lastCacheRefresh = Date.now();
  console.log(`[ALERT] Threshold cache loaded (${thresholdCache.size} entries)`);
}

export async function reloadThresholdCache(): Promise<void> {
  await loadThresholds();
}

function mapSensorTypeToEnum(type: string): "TEMPERATURE" | "HUMIDITY" | "PRESSURE" {
  return type.toUpperCase() as "TEMPERATURE" | "HUMIDITY" | "PRESSURE";
}

export async function processReading(reading: SensorReading, io: Server): Promise<void> {
  if (Date.now() - lastCacheRefresh > CACHE_TTL_MS) {
    await loadThresholds();
  }

  const enumType = mapSensorTypeToEnum(reading.type);
  const threshold = thresholdCache.get(enumType);

  if (!threshold || !threshold.isActive) return;

  let severity: SeverityLevel | null = null;
  let direction: DirectionLevel | null = null;
  let thresholdValue = 0;

  if (reading.value > threshold.criticalMax) {
    severity = "CRITICAL";
    direction = "ABOVE";
    thresholdValue = threshold.criticalMax;
  } else if (reading.value < threshold.criticalMin) {
    severity = "CRITICAL";
    direction = "BELOW";
    thresholdValue = threshold.criticalMin;
  } else if (reading.value > threshold.maxValue) {
    severity = "WARNING";
    direction = "ABOVE";
    thresholdValue = threshold.maxValue;
  } else if (reading.value < threshold.minValue) {
    severity = "WARNING";
    direction = "BELOW";
    thresholdValue = threshold.minValue;
  }

  if (!severity || !direction) return;

  // Dedup: skip if an unacknowledged alert exists for same sensor+type within last 60s
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

  io.to("dashboard").emit("alert:new", {
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
  });

  console.log(`[ALERT] ${severity} — ${message}`);

  if (severity === "CRITICAL") {
    const emailSent = await sendAlertEmail({
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

    if (emailSent) {
      await prisma.alert.update({
        where: { id: alert.id },
        data: { emailSent: true },
      });
    }
  }
}
