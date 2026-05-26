import { Router } from "express";
import { register, login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";
import { registerRules, loginRules, updateProfileRules, changePasswordRules } from "../validators/authValidator.js";

const router = Router();

router.post("/register", authLimiter, registerRules, validate, register);
router.post("/login", authLimiter, loginRules, validate, login);
router.get("/me", protect, getMe);
router.patch("/profile", protect, updateProfileRules, validate, updateProfile);
router.patch("/password", protect, changePasswordRules, validate, changePassword);

export default router;
