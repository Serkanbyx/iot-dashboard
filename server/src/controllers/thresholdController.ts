import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";

const VALID_SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE"] as const;
type SensorTypeEnum = (typeof VALID_SENSOR_TYPES)[number];

function isValidSensorType(value: string): value is SensorTypeEnum {
  return VALID_SENSOR_TYPES.includes(value as SensorTypeEnum);
}

export const getAllThresholds = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const thresholds = await prisma.thresholdConfig.findMany({
      orderBy: { sensorType: "asc" },
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

    if (!sensorType || !isValidSensorType(sensorType)) {
      res.status(400).json({ error: "Invalid sensor type. Must be TEMPERATURE, HUMIDITY, or PRESSURE" });
      return;
    }

    const { minValue, maxValue, criticalMin, criticalMax, isActive } = req.body;

    if (criticalMin >= minValue || minValue >= maxValue || maxValue >= criticalMax) {
      res.status(400).json({
        error: "Threshold ordering must be: criticalMin < minValue < maxValue < criticalMax",
      });
      return;
    }

    const threshold = await prisma.thresholdConfig.update({
      where: { sensorType },
      data: {
        minValue,
        maxValue,
        criticalMin,
        criticalMax,
        ...(typeof isActive === "boolean" && { isActive }),
        createdById: req.user!.id,
      },
    });

    // Alert engine cache refresh will be integrated in Step 9
    // alertEngine.refreshCache();

    res.json({ threshold });
  } catch (error) {
    next(error);
  }
};
