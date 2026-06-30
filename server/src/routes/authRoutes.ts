import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  getMe,
  getAuthConfig,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import {
  registerRules,
  loginRules,
  refreshRules,
  updateProfileRules,
  changePasswordRules,
} from "../validators/authValidator.js";

const router = Router();

router.get("/config", getAuthConfig);
router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.post("/refresh", authLimiter, refreshRules, validate, refresh);
router.post("/logout", logout);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfileRules, validate, updateProfile);
router.patch("/password", protect, changePasswordRules, validate, changePassword);

export default router;
