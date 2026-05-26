import { Router } from "express";
import { body } from "express-validator";
import { getAllThresholds, updateThreshold } from "../controllers/thresholdController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.get("/", protect, getAllThresholds);

router.patch(
  "/:sensorType",
  protect,
  adminOnly,
  [
    body("minValue").isFloat().withMessage("minValue must be a number"),
    body("maxValue").isFloat().withMessage("maxValue must be a number"),
    body("criticalMin").isFloat().withMessage("criticalMin must be a number"),
    body("criticalMax").isFloat().withMessage("criticalMax must be a number"),
    body("isActive").optional().isBoolean().withMessage("isActive must be a boolean"),
  ],
  validate,
  updateThreshold
);

export default router;
