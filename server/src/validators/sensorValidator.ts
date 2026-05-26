import { query } from "express-validator";

const VALID_TYPES = ["temperature", "humidity", "pressure"];

export const historyRules = [
  query("sensorId")
    .notEmpty()
    .withMessage("sensorId is required")
    .isLength({ max: 50 })
    .withMessage("sensorId max 50 characters"),
  query("type")
    .isIn(VALID_TYPES)
    .withMessage("type must be temperature, humidity, or pressure"),
  query("start")
    .optional()
    .isISO8601()
    .withMessage("start must be a valid ISO 8601 date"),
  query("stop")
    .optional()
    .isISO8601()
    .withMessage("stop must be a valid ISO 8601 date"),
];

export const aggregatedRules = [
  query("sensorId")
    .notEmpty()
    .withMessage("sensorId is required")
    .isLength({ max: 50 })
    .withMessage("sensorId max 50 characters"),
  query("type")
    .isIn(VALID_TYPES)
    .withMessage("type must be temperature, humidity, or pressure"),
  query("window")
    .optional()
    .isIn(["minute", "hour"])
    .withMessage("window must be minute or hour"),
  query("start")
    .optional()
    .isISO8601()
    .withMessage("start must be a valid ISO 8601 date"),
  query("stop")
    .optional()
    .isISO8601()
    .withMessage("stop must be a valid ISO 8601 date"),
];
