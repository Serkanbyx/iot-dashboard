import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { reloadThresholdCache } from "../services/alertEngine.js";
import { buildChangeSet, logAudit } from "../services/auditService.js";

const VALID_SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE"] as const;
type SensorTypeEnum = (typeof VALID_SENSOR_TYPES)[number];

function isValidSensorType(value: string): value is SensorTypeEnum {
  return VALID_SENSOR_TYPES.includes(value as SensorTypeEnum);
}

function thresholdKey(sensorType: SensorTypeEnum, sensorId = "") {
  return { sensorType_sensorId: { sensorType, sensorId } };
}

export const getAllThresholds = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const thresholds = await prisma.thresholdConfig.findMany({
      orderBy: [{ sensorId: "asc" }, { sensorType: "asc" }],
    });

    res.json({ thresholds });
  } catch (error) {
    next(error);
  }
};

export const updateThreshold = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sensorType = req.params.sensorType as string | undefined;
    const deviceSensorId = (req.params.sensorId as string | undefined) ?? "";

    if (!sensorType || !isValidSensorType(sensorType)) {
      res.status(400).json({
        error: "Invalid sensor type. Must be TEMPERATURE, HUMIDITY, or PRESSURE",
      });
      return;
    }

    const { minValue, maxValue, criticalMin, criticalMax, isActive } = req.body;

    if (criticalMin >= minValue || minValue >= maxValue || maxValue >= criticalMax) {
      res.status(400).json({
        error: "Threshold ordering must be: criticalMin < minValue < maxValue < criticalMax",
      });
      return;
    }

    const before = await prisma.thresholdConfig.findUnique({
      where: thresholdKey(sensorType, deviceSensorId),
    });

    const threshold = await prisma.thresholdConfig.upsert({
      where: thresholdKey(sensorType, deviceSensorId),
      update: {
        minValue,
        maxValue,
        criticalMin,
        criticalMax,
        ...(typeof isActive === "boolean" && { isActive }),
        createdById: req.user!.id,
      },
      create: {
        sensorType,
        sensorId: deviceSensorId,
        minValue,
        maxValue,
        criticalMin,
        criticalMax,
        unit:
          sensorType === "TEMPERATURE"
            ? "°C"
            : sensorType === "HUMIDITY"
              ? "%"
              : "hPa",
        ...(typeof isActive === "boolean" && { isActive }),
        createdById: req.user!.id,
      },
    });

    await reloadThresholdCache();

    await logAudit({
      entityType: "THRESHOLD",
      entityId: `${threshold.sensorId || "global"}:${threshold.sensorType}`,
      action: before ? "UPDATE" : "CREATE",
      actorId: req.user!.id,
      summary: `${before ? "Updated" : "Created"} ${deviceSensorId || "global"} ${sensorType} threshold`,
      changes: before
        ? buildChangeSet(before, threshold, [
            "minValue",
            "maxValue",
            "criticalMin",
            "criticalMax",
            "isActive",
          ])
        : undefined,
    });

    res.json({ threshold });
  } catch (error) {
    next(error);
  }
};

export const deleteDeviceThreshold = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sensorType = req.params.sensorType as string;
    const deviceSensorId = req.params.sensorId as string;

    if (!isValidSensorType(sensorType) || !deviceSensorId) {
      res.status(400).json({ error: "Invalid threshold reference" });
      return;
    }

    const existing = await prisma.thresholdConfig.findUnique({
      where: thresholdKey(sensorType, deviceSensorId),
    });

    if (!existing) {
      res.status(404).json({ error: "Device threshold override not found" });
      return;
    }

    await prisma.thresholdConfig.delete({
      where: thresholdKey(sensorType, deviceSensorId),
    });

    await reloadThresholdCache();

    await logAudit({
      entityType: "THRESHOLD",
      entityId: `${deviceSensorId}:${sensorType}`,
      action: "DELETE",
      actorId: req.user!.id,
      summary: `Removed device override for ${deviceSensorId} ${sensorType}`,
    });

    res.json({ message: "Device threshold override removed" });
  } catch (error) {
    next(error);
  }
};
