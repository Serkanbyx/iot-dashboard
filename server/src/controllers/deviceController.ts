import type { Request, Response, NextFunction } from "express";
import prisma from "../config/database.js";
import { refreshDeviceCache } from "../services/mqttConsumer.js";
import { buildChangeSet, logAudit } from "../services/auditService.js";

function paramStr(val: string | string[] | undefined): string {
  return Array.isArray(val) ? val[0] : val ?? "";
}

export const getDevices = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const floor = req.query.floor ? paramStr(req.query.floor as string) : undefined;
    const where = floor ? { floor } : {};

    const devices = await prisma.device.findMany({
      where,
      orderBy: [{ floor: "asc" }, { sensorId: "asc" }],
    });

    res.json({ devices });
  } catch (error) {
    next(error);
  }
};

export const getDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = paramStr(req.params.id);
    const device = await prisma.device.findUnique({ where: { id } });

    if (!device) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    res.json({ device });
  } catch (error) {
    next(error);
  }
};

export const createDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sensorId, name, floor, types } = req.body;

    const existing = await prisma.device.findUnique({ where: { sensorId } });
    if (existing) {
      res.status(409).json({ error: "A device with this sensorId already exists" });
      return;
    }

    const device = await prisma.device.create({
      data: {
        sensorId,
        name,
        floor,
        types,
        createdById: req.user?.id,
      },
    });

    await refreshDeviceCache();

    await logAudit({
      entityType: "DEVICE",
      entityId: device.id,
      action: "CREATE",
      actorId: req.user!.id,
      summary: `Created device ${device.sensorId}`,
      changes: { sensorId, name, floor, types },
    });

    res.status(201).json({ device });
  } catch (error) {
    next(error);
  }
};

export const updateDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = paramStr(req.params.id);
    const { name, floor, types, isActive } = req.body;

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    const device = await prisma.device.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(floor !== undefined && { floor }),
        ...(types !== undefined && { types }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    await refreshDeviceCache();

    await logAudit({
      entityType: "DEVICE",
      entityId: device.id,
      action: "UPDATE",
      actorId: req.user!.id,
      summary: `Updated device ${device.sensorId}`,
      changes: buildChangeSet(existing, device, ["name", "floor", "types", "isActive"]),
    });

    res.json({ device });
  } catch (error) {
    next(error);
  }
};

export const deleteDevice = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = paramStr(req.params.id);

    const existing = await prisma.device.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: "Device not found" });
      return;
    }

    await prisma.device.delete({ where: { id } });

    await refreshDeviceCache();

    await logAudit({
      entityType: "DEVICE",
      entityId: existing.id,
      action: "DELETE",
      actorId: req.user!.id,
      summary: `Deleted device ${existing.sensorId}`,
    });

    res.json({ message: "Device deleted" });
  } catch (error) {
    next(error);
  }
};
