import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { getIO } from "../services/socketService.js";

const SORT_WHITELIST = ["createdAt", "severity", "sensorType", "sensorId", "floor"] as const;
type SortField = (typeof SORT_WHITELIST)[number];

function isSortField(value: string): value is SortField {
  return SORT_WHITELIST.includes(value as SortField);
}

export const getAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (req.query.severity) {
      where.severity = req.query.severity;
    }
    if (req.query.sensorType) {
      where.sensorType = req.query.sensorType;
    }
    if (req.query.sensorId) {
      where.sensorId = req.query.sensorId;
    }
    if (req.query.isAcknowledged !== undefined) {
      where.isAcknowledged = req.query.isAcknowledged === "true";
    }

    const sortField = (req.query.sort as string) || "createdAt";
    const sortOrder = (req.query.order as string) === "asc" ? "asc" : "desc";
    const orderBy = isSortField(sortField)
      ? { [sortField]: sortOrder }
      : { createdAt: "desc" as const };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({ where, orderBy, skip, take: limit }),
      prisma.alert.count({ where }),
    ]);

    res.json({
      alerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAlertStats = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const [total, unacknowledged, bySeverityRaw, byTypeRaw, last24h] = await Promise.all([
      prisma.alert.count(),
      prisma.alert.count({ where: { isAcknowledged: false } }),
      prisma.alert.groupBy({
        by: ["severity"],
        _count: { _all: true },
      }),
      prisma.alert.groupBy({
        by: ["sensorType"],
        _count: { _all: true },
      }),
      prisma.alert.count({
        where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    const bySeverity: Record<string, number> = { WARNING: 0, CRITICAL: 0 };
    for (const row of bySeverityRaw) {
      bySeverity[row.severity] = row._count._all;
    }

    const byType: Record<string, number> = { TEMPERATURE: 0, HUMIDITY: 0, PRESSURE: 0 };
    for (const row of byTypeRaw) {
      byType[row.sensorType] = row._count._all;
    }

    res.json({ total, unacknowledged, bySeverity, byType, last24h });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAlert = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const alertId = req.params.id as string | undefined;

    if (!alertId) {
      res.status(400).json({ error: "Alert ID is required" });
      return;
    }

    const rawNote = typeof req.body?.note === "string" ? req.body.note.trim() : "";
    const note = rawNote.length > 0 ? rawNote : null;

    const alert = await prisma.alert.update({
      where: { id: alertId },
      data: {
        isAcknowledged: true,
        acknowledgedById: req.user!.id,
        acknowledgedAt: new Date(),
        acknowledgeNote: note,
      },
    });

    getIO().to("dashboard").emit("alert:acknowledged", {
      alertId: alert.id,
      acknowledgedBy: req.user!.name,
    });

    res.json({ alert });
  } catch (error) {
    next(error);
  }
};

export const acknowledgeAll = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const result = await prisma.alert.updateMany({
      where: { isAcknowledged: false },
      data: {
        isAcknowledged: true,
        acknowledgedById: req.user!.id,
        acknowledgedAt: new Date(),
      },
    });

    res.json({ acknowledged: result.count });
  } catch (error) {
    next(error);
  }
};

export const deleteOldAlerts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const days = Math.min(365, Math.max(1, Number(req.query.days) || 30));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const result = await prisma.alert.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });

    res.json({ deleted: result.count, olderThan: `${days} days` });
  } catch (error) {
    next(error);
  }
};
