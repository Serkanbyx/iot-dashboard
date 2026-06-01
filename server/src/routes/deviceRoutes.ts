import { Router } from "express";
import {
  getDevices,
  getDevice,
  createDevice,
  updateDevice,
  deleteDevice,
} from "../controllers/deviceController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { apiLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { createDeviceRules, updateDeviceRules } from "../validators/deviceValidator.js";

const router = Router();

router.get("/", protect, apiLimiter, getDevices);
router.get("/:id", protect, apiLimiter, getDevice);
router.post("/", protect, adminOnly, createDeviceRules, validate, createDevice);
router.patch("/:id", protect, adminOnly, updateDeviceRules, validate, updateDevice);
router.delete("/:id", protect, adminOnly, deleteDevice);

export default router;
