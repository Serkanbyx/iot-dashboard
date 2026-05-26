import { body } from "express-validator";

export const updateThresholdRules = [
  body("minValue")
    .isFloat()
    .withMessage("minValue must be a number"),
  body("maxValue")
    .isFloat()
    .withMessage("maxValue must be a number"),
  body("criticalMin")
    .isFloat()
    .withMessage("criticalMin must be a number"),
  body("criticalMax")
    .isFloat()
    .withMessage("criticalMax must be a number"),
  body("isActive")
    .optional()
    .isBoolean()
    .withMessage("isActive must be a boolean"),
  body().custom((_, { req }) => {
    const { criticalMin, minValue, maxValue, criticalMax } = req.body;
    if (criticalMin >= minValue || minValue >= maxValue || maxValue >= criticalMax) {
      throw new Error("Ordering must be: criticalMin < minValue < maxValue < criticalMax");
    }
    return true;
  }),
];
