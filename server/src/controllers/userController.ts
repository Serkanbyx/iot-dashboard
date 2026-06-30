import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import { buildChangeSet, logAudit } from "../services/auditService.js";
import { revokeAllUserRefreshTokens } from "../services/refreshTokenService.js";

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  lastLogin: true,
  createdAt: true,
} as const;

export const getUsers = async (
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: userSelect,
      orderBy: { createdAt: "asc" },
    });

    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email, password, role } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role ?? "VIEWER",
      },
      select: userSelect,
    });

    await logAudit({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE",
      actorId: req.user!.id,
      summary: `Created user ${user.email}`,
      changes: { email: user.email, role: user.role },
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { name, email, role, isActive } = req.body;

    if (id === req.user!.id && role && role !== req.user!.role) {
      res.status(400).json({ error: "You cannot change your own role" });
      return;
    }

    if (id === req.user!.id && isActive === false) {
      res.status(400).json({ error: "You cannot deactivate your own account" });
      return;
    }

    const before = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!before) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(role !== undefined && { role }),
        ...(isActive !== undefined && { isActive }),
      },
      select: userSelect,
    });

    if (isActive === false || role !== undefined) {
      await revokeAllUserRefreshTokens(id);
    }

    await logAudit({
      entityType: "USER",
      entityId: user.id,
      action: "UPDATE",
      actorId: req.user!.id,
      summary: `Updated user ${user.email}`,
      changes: buildChangeSet(before, user, ["name", "email", "role", "isActive"]),
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const id = req.params.id as string;

    if (id === req.user!.id) {
      res.status(400).json({ error: "You cannot delete your own account" });
      return;
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true },
    });

    if (!existing) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id } });

    await logAudit({
      entityType: "USER",
      entityId: existing.id,
      action: "DELETE",
      actorId: req.user!.id,
      summary: `Deleted user ${existing.email}`,
    });

    res.json({ message: "User deleted" });
  } catch (error) {
    next(error);
  }
};
