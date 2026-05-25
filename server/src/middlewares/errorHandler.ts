import type { Request, Response, NextFunction } from "express";
import config from "../config/env.js";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
  code?: string;
}

function getPrismaStatusCode(code: string): number | null {
  switch (code) {
    case "P2002": return 409; // Unique constraint violation
    case "P2025": return 404; // Record not found
    case "P2003": return 400; // Foreign key constraint failure
    default: return null;
  }
}

function getPrismaMessage(code: string): string {
  switch (code) {
    case "P2002": return "A record with this value already exists";
    case "P2025": return "Record not found";
    case "P2003": return "Related record not found";
    default: return "Database error";
  }
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const isDev = config.NODE_ENV === "development";

  // Prisma errors
  if (err.code?.startsWith("P")) {
    const statusCode = getPrismaStatusCode(err.code) ?? 500;
    const message = isDev ? err.message : getPrismaMessage(err.code);
    console.error(`[ERROR] Prisma ${err.code}: ${err.message}`);
    res.status(statusCode).json({ error: message });
    return;
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({ error: "Invalid token" });
    return;
  }
  if (err.name === "TokenExpiredError") {
    res.status(401).json({ error: "Token expired" });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : "");

  res.status(statusCode).json({
    error: statusCode >= 500 && !isDev ? "Internal server error" : err.message,
    ...(isDev && { stack: err.stack }),
  });
};
