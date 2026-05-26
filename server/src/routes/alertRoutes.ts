import { Router } from "express";
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
import { getAlertsRules, cleanupRules } from "../validators/alertValidator.js";

const router = Router();

router.get("/", protect, apiLimiter, getAlertsRules, validate, getAlerts);
router.get("/stats", protect, getAlertStats);
router.patch("/:id/acknowledge", protect, adminOnly, acknowledgeAlert);
router.patch("/acknowledge-all", protect, adminOnly, acknowledgeAll);
router.delete("/cleanup", protect, adminOnly, cleanupRules, validate, deleteOldAlerts);

export default router;
