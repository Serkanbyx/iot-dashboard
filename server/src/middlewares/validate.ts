import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const validate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    res.status(400).json({
      error: "Validation failed",
      details: errors.array().map((e) => ({
        field: "path" in e ? e.path : "unknown",
        message: e.msg,
      })),
    });
    return;
  }

  next();
};
