import type { Request, Response, NextFunction } from "express";
import mongoSanitize from "express-mongo-sanitize";

/**
 * Sanitizes req.body and req.params against NoSQL injection.
 * req.query is intentionally skipped — Express 5 makes it read-only.
 */
export const sanitize = (req: Request, _res: Response, next: NextFunction): void => {
  if (req.body) {
    mongoSanitize.sanitize(req.body);
  }
  if (req.params) {
    mongoSanitize.sanitize(req.params as Record<string, unknown>);
  }
  next();
};
