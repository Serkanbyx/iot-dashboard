import { Router } from "express";
import { query } from "express-validator";
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

const router = Router();

const VALID_TYPES = ["temperature", "humidity", "pressure"];

const historyValidation = [
  query("sensorId").notEmpty().withMessage("sensorId is required"),
  query("type").isIn(VALID_TYPES).withMessage("type must be temperature, humidity, or pressure"),
  query("start").optional().isISO8601().withMessage("start must be a valid ISO 8601 date"),
  query("stop").optional().isISO8601().withMessage("stop must be a valid ISO 8601 date"),
];

const aggregatedValidation = [
  query("sensorId").notEmpty().withMessage("sensorId is required"),
  query("type").isIn(VALID_TYPES).withMessage("type must be temperature, humidity, or pressure"),
  query("window").optional().isIn(["minute", "hour"]).withMessage("window must be minute or hour"),
  query("start").optional().isISO8601().withMessage("start must be a valid ISO 8601 date"),
  query("stop").optional().isISO8601().withMessage("stop must be a valid ISO 8601 date"),
];

router.get("/latest", protect, apiLimiter, getLatestReadings);
router.get("/history", protect, apiLimiter, historyValidation, validate, getSensorHistory);
router.get("/aggregated", protect, apiLimiter, aggregatedValidation, validate, getAggregatedData);
router.get("/list", protect, getSensorList);
router.get("/floors", protect, getFloorOverview);

export default router;
