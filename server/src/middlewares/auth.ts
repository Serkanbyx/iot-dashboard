import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/database.js";
import config from "../config/env.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        name: string;
        email: string;
        role: "ADMIN" | "VIEWER";
      };
    }
  }
}

interface JwtPayload {
  userId: string;
}

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Not authorized — no token provided" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, config.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, name: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: "Not authorized — user not found or inactive" });
      return;
    }

    req.user = { id: user.id, name: user.name, email: user.email, role: user.role };
    next();
  } catch {
    res.status(401).json({ error: "Not authorized — invalid token" });
  }
};

export const adminOnly = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== "ADMIN") {
    res.status(403).json({ error: "Forbidden — admin access required" });
    return;
  }
  next();
};
