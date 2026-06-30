import { Router } from "express";
import { getAuditLogs } from "../controllers/auditController.js";
import { protect, adminOnly } from "../middlewares/auth.js";

const router = Router();

router.get("/", protect, adminOnly, getAuditLogs);

export default router;
