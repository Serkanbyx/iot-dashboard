import { Router } from "express";
import { body } from "express-validator";
import { register, login, getMe, updateProfile, changePassword } from "../controllers/authController.js";
import { protect } from "../middlewares/auth.js";
import { authLimiter } from "../middlewares/rateLimiter.js";
import { validate } from "../middlewares/validate.js";

const router = Router();

router.post(
  "/register",
  authLimiter,
  [
    body("name").trim().notEmpty().withMessage("Name is required").isLength({ max: 50 }),
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  validate,
  register
);

router.post(
  "/login",
  authLimiter,
  [
    body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  validate,
  login
);

router.get("/me", protect, getMe);

router.patch(
  "/profile",
  protect,
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty")
      .isLength({ max: 50 }),
    body("email")
      .optional()
      .trim()
      .isEmail()
      .withMessage("Valid email is required")
      .normalizeEmail(),
  ],
  validate,
  updateProfile
);

router.patch(
  "/password",
  protect,
  [
    body("currentPassword").notEmpty().withMessage("Current password is required"),
    body("newPassword")
      .isLength({ min: 6 })
      .withMessage("New password must be at least 6 characters"),
  ],
  validate,
  changePassword
);

export default router;
