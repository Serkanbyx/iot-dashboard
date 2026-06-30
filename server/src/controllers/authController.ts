import type { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../config/database.js";
import config from "../config/env.js";
import { generateAccessToken } from "../utils/generateToken.js";
import {
  createRefreshToken,
  revokeRefreshToken,
  rotateRefreshToken,
} from "../services/refreshTokenService.js";

const BCRYPT_ROUNDS = 12;

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
} as const;

async function issueAuthTokens(userId: string) {
  const [token, refreshToken] = await Promise.all([
    Promise.resolve(generateAccessToken(userId)),
    createRefreshToken(userId),
  ]);

  return { token, refreshToken };
}

export const getAuthConfig = (_req: Request, res: Response): void => {
  res.json({ registrationAllowed: config.ALLOW_REGISTRATION });
};

export const register = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!config.ALLOW_REGISTRATION) {
      res.status(403).json({ error: "Registration is currently disabled" });
      return;
    }

    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
      select: userSelect,
    });

    const tokens = await issueAuthTokens(user.id);

    res.status(201).json({ user, ...tokens });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const tokens = await issueAuthTokens(user.id);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      ...tokens,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token is required" });
      return;
    }

    const rotated = await rotateRefreshToken(refreshToken);
    if (!rotated) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: rotated.userId },
      select: userSelect,
    });

    if (!user) {
      res.status(401).json({ error: "User not found" });
      return;
    }

    res.json({
      user,
      token: generateAccessToken(user.id),
      refreshToken: rotated.refreshToken,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        lastLogin: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { name, email } = req.body;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
      select: { id: true, name: true, email: true, role: true },
    });

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(400).json({ error: "Current password is incorrect" });
      return;
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password updated successfully" });
  } catch (error) {
    next(error);
  }
};
