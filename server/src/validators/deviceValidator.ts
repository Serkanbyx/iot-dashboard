import { body } from "express-validator";

const VALID_SENSOR_TYPES = ["TEMPERATURE", "HUMIDITY", "PRESSURE"];

export const createDeviceRules = [
  body("sensorId")
    .isString()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("sensorId must be 3-50 characters")
    .matches(/^[a-zA-Z0-9-]+$/)
    .withMessage("sensorId must be alphanumeric with hyphens only"),
  body("name")
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("name must be 3-100 characters"),
  body("floor")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("floor is required"),
  body("types")
    .isArray({ min: 1 })
    .withMessage("types must be a non-empty array"),
  body("types.*")
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Each type must be one of: ${VALID_SENSOR_TYPES.join(", ")}`),
];

export const updateDeviceRules = [
  body("name")
    .optional()
    .isString()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage("name must be 3-100 characters"),
  body("floor")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("floor cannot be empty"),
  body("types")
    .optional()
    .isArray({ min: 1 })
    .withMessage("types must be a non-empty array"),
  body("types.*")
    .optional()
    .isIn(VALID_SENSOR_TYPES)
    .withMessage(`Each type must be one of: ${VALID_SENSOR_TYPES.join(", ")}`),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
];
