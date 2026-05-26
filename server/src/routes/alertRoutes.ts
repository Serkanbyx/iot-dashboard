import { Router } from "express";
import { query } from "express-validator";
import {
  getAlerts,
  getAlertStats,
  acknowledgeAlert,
  acknowledgeAll,
  deleteOldAlerts,
} from "../controllers/alertController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.get(
  "/",
  protect,
  apiLimiter,
  [
    query("page").optional().isInt({ min: 1 }).withMessage("page must be a positive integer"),
    query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("limit must be 1-100"),
    query("severity").optional().isIn(["WARNING", "CRITICAL"]).withMessage("Invalid severity"),
    query("sensorType").optional().isIn(["TEMPERATURE", "HUMIDITY", "PRESSURE"]).withMessage("Invalid sensorType"),
    query("isAcknowledged").optional().isIn(["true", "false"]).withMessage("isAcknowledged must be true or false"),
    query("sensorId").optional().isString(),
    query("sort").optional().isIn(["createdAt", "severity", "sensorType", "sensorId", "floor"]).withMessage("Invalid sort field"),
    query("order").optional().isIn(["asc", "desc"]).withMessage("order must be asc or desc"),
  ],
  validate,
  getAlerts
);

router.get("/stats", protect, getAlertStats);

router.patch("/:id/acknowledge", protect, adminOnly, acknowledgeAlert);

router.patch("/acknowledge-all", protect, adminOnly, acknowledgeAll);

router.delete(
  "/cleanup",
  protect,
  adminOnly,
  [
    query("days").optional().isInt({ min: 1, max: 365 }).withMessage("days must be 1-365"),
  ],
  validate,
  deleteOldAlerts
);

export default router;
