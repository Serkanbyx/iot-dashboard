import { Router } from "express";
import { getUsers, createUser, updateUser, deleteUser } from "../controllers/userController.js";
import { protect, adminOnly } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import {
  createUserRules,
  updateUserRules,
} from "../validators/userValidator.js";

const router = Router();

router.use(protect, adminOnly);

router.get("/", getUsers);
router.post("/", createUserRules, validate, createUser);
router.patch("/:id", updateUserRules, validate, updateUser);
router.delete("/:id", deleteUser);

export default router;
