import { Router } from "express";
import {
  getLatestReadings,
  getSensorHistory,
  getAggregatedData,
  getSensorList,
  getFloorOverview,
} from "../controllers/sensorController.js";
import { protect } from "../middlewares/auth.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { historyRules, aggregatedRules } from "../validators/sensorValidator.js";

const router = Router();

router.get("/latest", protect, apiLimiter, getLatestReadings);
router.get("/history", protect, apiLimiter, historyRules, validate, getSensorHistory);
router.get("/aggregated", protect, apiLimiter, aggregatedRules, validate, getAggregatedData);
router.get("/list", protect, getSensorList);
router.get("/floors", protect, getFloorOverview);

export default router;
