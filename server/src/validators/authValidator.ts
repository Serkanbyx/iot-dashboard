import { body } from "express-validator";

export const registerRules = [
  body("name")
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginRules = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
  body("password")
    .notEmpty()
    .withMessage("Password is required"),
];

export const updateProfileRules = [
  body("name")
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be 2-50 characters"),
  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

export const changePasswordRules = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Current password is required"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("New password must be at least 6 characters"),
];

export const refreshRules = [
  body("refreshToken")
    .isString()
    .isLength({ min: 20 })
    .withMessage("Refresh token is required"),
];
