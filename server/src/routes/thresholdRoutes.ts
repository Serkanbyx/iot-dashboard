import { Router } from "express";
import { getAllThresholds, updateThreshold } from "../controllers/thresholdController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { updateThresholdRules } from "../validators/thresholdValidator.js";

const router = Router();

router.get("/", protect, getAllThresholds);
router.patch("/:sensorType", protect, adminOnly, updateThresholdRules, validate, updateThreshold);

export default router;
