import { body, param } from "express-validator";

export const createUserRules = [
  body("name").trim().isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role").optional().isIn(["ADMIN", "VIEWER"]).withMessage("Role must be ADMIN or VIEWER"),
];

export const updateUserRules = [
  param("id").isUUID().withMessage("Invalid user ID"),
  body("name").optional().trim().isLength({ min: 2, max: 50 }),
  body("email").optional().isEmail().normalizeEmail(),
  body("role").optional().isIn(["ADMIN", "VIEWER"]),
  body("isActive").optional().isBoolean(),
];
