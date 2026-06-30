import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";

const MAX_RANGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface RawReading {
  time: Date;
  sensor_id: string;
  floor: string;
  sensor_type: string;
  value: number;
  unit: string;
}

interface AggregatedRow {
  bucket: Date;
  avg_value: number;
  min_value: number;
  max_value: number;
  reading_count: bigint;
}

interface SensorListRow {
  sensor_id: string;
  floor: string;
  last_seen: Date;
}

function formatReading(row: RawReading) {
  return {
    sensorId: row.sensor_id,
    floor: row.floor,
    type: row.sensor_type,
    value: row.value,
    unit: row.unit,
    timestamp: row.time.toISOString(),
  };
}

export const getLatestReadings = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rows = await prisma.$queryRawUnsafe<RawReading[]>(`
      SELECT DISTINCT ON (sensor_id, sensor_type)
        time, sensor_id, floor, sensor_type, value, unit
      FROM sensor_readings
      ORDER BY sensor_id, sensor_type, time DESC
    `);

    res.json({ readings: rows.map(formatReading) });
  } catch (error) {
    next(error);
  }
};

export const getSensorHistory = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sensorId = req.query.sensorId as string;
    const type = req.query.type as string;
    const start = new Date((req.query.start as string) || new Date(Date.now() - 3600000).toISOString());
    const stop = new Date((req.query.stop as string) || new Date().toISOString());

    if (stop.getTime() - start.getTime() > MAX_RANGE_MS) {
      res.status(400).json({ error: "Maximum range is 7 days" });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<RawReading[]>(
      `SELECT time, sensor_id, floor, sensor_type, value, unit
       FROM sensor_readings
       WHERE sensor_id = $1 AND sensor_type = $2
         AND time >= $3::timestamptz AND time <= $4::timestamptz
       ORDER BY time DESC
       LIMIT 5000`,
      sensorId,
      type,
      start,
      stop
    );

    res.json({ readings: rows.map(formatReading) });
  } catch (error) {
    next(error);
  }
};

export const getAggregatedData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sensorId = req.query.sensorId as string;
    const type = req.query.type as string;
    const window = req.query.window as string || "hour";
    const start = new Date((req.query.start as string) || new Date(Date.now() - 3600000).toISOString());
    const stop = new Date((req.query.stop as string) || new Date().toISOString());

    if (stop.getTime() - start.getTime() > MAX_RANGE_MS) {
      res.status(400).json({ error: "Maximum range is 7 days" });
      return;
    }

    if (!["minute", "hour"].includes(window)) {
      res.status(400).json({ error: "Window must be 'minute' or 'hour'" });
      return;
    }

    const rows = await prisma.$queryRawUnsafe<AggregatedRow[]>(
      `SELECT
        date_trunc($1, time) AS bucket,
        AVG(value) AS avg_value,
        MIN(value) AS min_value,
        MAX(value) AS max_value,
        COUNT(*) AS reading_count
      FROM sensor_readings
      WHERE sensor_id = $2 AND sensor_type = $3
        AND time >= $4::timestamptz AND time <= $5::timestamptz
      GROUP BY bucket ORDER BY bucket ASC`,
      window,
      sensorId,
      type,
      start,
      stop
    );

    res.json({
      data: rows.map((row) => ({
        bucket: row.bucket.toISOString(),
        avgValue: Number(row.avg_value),
        minValue: Number(row.min_value),
        maxValue: Number(row.max_value),
        readingCount: Number(row.reading_count),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getSensorList = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rows = await prisma.$queryRawUnsafe<SensorListRow[]>(`
      SELECT sensor_id, floor, MAX(time) AS last_seen
      FROM sensor_readings
      GROUP BY sensor_id, floor
      ORDER BY floor, sensor_id
    `);

    res.json({
      sensors: rows.map((row) => ({
        sensorId: row.sensor_id,
        floor: row.floor,
        lastSeen: row.last_seen.toISOString(),
      })),
    });
  } catch (error) {
    next(error);
  }
};

export const getFloorOverview = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const rows = await prisma.$queryRawUnsafe<RawReading[]>(`
      SELECT DISTINCT ON (sensor_id, sensor_type)
        time, sensor_id, floor, sensor_type, value, unit
      FROM sensor_readings
      ORDER BY sensor_id, sensor_type, time DESC
    `);

    const floorMap = new Map<string, ReturnType<typeof formatReading>[]>();

    for (const row of rows) {
      const reading = formatReading(row);
      const existing = floorMap.get(reading.floor) ?? [];
      existing.push(reading);
      floorMap.set(reading.floor, existing);
    }

    const floors = Array.from(floorMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([floor, readings]) => ({ floor, readings }));

    res.json({ floors });
  } catch (error) {
    next(error);
  }
};
