import { body, query } from "express-validator";

export const getAlertsRules = [
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be 1-100"),
  query("severity")
    .optional()
    .isIn(["WARNING", "CRITICAL"])
    .withMessage("severity must be WARNING or CRITICAL"),
  query("sensorType")
    .optional()
    .isIn(["TEMPERATURE", "HUMIDITY", "PRESSURE"])
    .withMessage("sensorType must be TEMPERATURE, HUMIDITY, or PRESSURE"),
  query("isAcknowledged")
    .optional()
    .isIn(["true", "false"])
    .withMessage("isAcknowledged must be true or false"),
  query("sensorId")
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage("sensorId max 50 characters"),
  query("sort")
    .optional()
    .isIn(["createdAt", "severity", "sensorType", "sensorId", "floor"])
    .withMessage("Invalid sort field"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("order must be asc or desc"),
];

export const acknowledgeRules = [
  body("note")
    .optional({ nullable: true })
    .isString()
    .withMessage("note must be a string")
    .trim()
    .isLength({ max: 500 })
    .withMessage("note max 500 characters"),
];

export const cleanupRules = [
  query("days")
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage("days must be 1-365"),
];
