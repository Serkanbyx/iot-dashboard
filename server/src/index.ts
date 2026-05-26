import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "node:http";

import config from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initSocket } from "./services/socketService.js";
import { startMqttConsumer } from "./services/mqttConsumer.js";
import { sanitize } from "./middlewares/sanitize.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import authRoutes from "./routes/authRoutes.js";
import thresholdRoutes from "./routes/thresholdRoutes.js";

const app = express();
const httpServer = createServer(app);
const io = initSocket(httpServer);

// --- Middleware Stack ---
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({ origin: config.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true, limit: "10kb" }));
app.use(sanitize);
app.use(globalLimiter);

// --- Health Check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/thresholds", thresholdRoutes);
// app.use("/api/sensors", sensorRoutes);
// app.use("/api/alerts", alertRoutes);

// --- Error Handler (must be last) ---
app.use(errorHandler);

// --- Startup ---
async function bootstrap(): Promise<void> {
  try {
    await connectDatabase();
    startMqttConsumer(io);

    httpServer.listen(config.PORT, () => {
      console.log(
        `[SERVER] Running on port ${config.PORT} in ${config.NODE_ENV} mode`
      );
    });
  } catch (error) {
    console.error("[SERVER] Failed to start:", error);
    process.exit(1);
  }
}

// --- Graceful Shutdown ---
async function shutdown(signal: string): Promise<void> {
  console.log(`\n[SERVER] ${signal} received — shutting down gracefully…`);
  httpServer.close();
  await disconnectDatabase();
  process.exit(0);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap();

export { app, httpServer };
