import type { Request, Response, NextFunction } from "express";
import config from "../config/env.js";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const statusCode = err.statusCode ?? 500;
  const isDev = config.NODE_ENV === "development";

  console.error(`[ERROR] ${err.message}`, isDev ? err.stack : "");

  res.status(statusCode).json({
    error: statusCode >= 500 && !isDev ? "Internal server error" : err.message,
    ...(isDev && { stack: err.stack }),
  });
};
