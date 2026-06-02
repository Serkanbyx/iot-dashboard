import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import config from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { initSocket } from "./services/socketService.js";
import { startMqttConsumer } from "./services/mqttConsumer.js";
import { sanitize } from "./middlewares/sanitize.js";
import { globalLimiter } from "./middlewares/rateLimiter.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { setupSwagger } from "./config/swagger.js";
import authRoutes from "./routes/authRoutes.js";
import thresholdRoutes from "./routes/thresholdRoutes.js";
import sensorRoutes from "./routes/sensorRoutes.js";
import alertRoutes from "./routes/alertRoutes.js";
import deviceRoutes from "./routes/deviceRoutes.js";

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

// --- Swagger ---
setupSwagger(app);

// --- Root Welcome Page ---
const __indexDir = dirname(fileURLToPath(import.meta.url));
const pkgJson = JSON.parse(
  readFileSync(resolve(__indexDir, "../package.json"), "utf-8")
);

app.get("/", (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>IoT Dashboard API</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#0a0e1a;color:#e2e8f0;overflow:hidden}
body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 80% 50% at 50% -20%,rgba(59,130,246,.15),transparent),radial-gradient(ellipse 60% 40% at 80% 110%,rgba(16,185,129,.1),transparent);pointer-events:none}
body::after{content:'';position:fixed;inset:0;background-image:radial-gradient(rgba(59,130,246,.06) 1px,transparent 1px);background-size:28px 28px;pointer-events:none}
.container{position:relative;z-index:1;text-align:center;padding:2rem 1.5rem}
.pulse-ring{width:72px;height:72px;border-radius:50%;border:2px solid rgba(59,130,246,.3);margin:0 auto 1.5rem;display:flex;align-items:center;justify-content:center;animation:ring-pulse 2.5s ease-in-out infinite}
@keyframes ring-pulse{0%,100%{box-shadow:0 0 0 0 rgba(59,130,246,.3),0 0 20px rgba(59,130,246,.1)}50%{box-shadow:0 0 0 12px rgba(59,130,246,0),0 0 30px rgba(59,130,246,.2)}}
.pulse-ring svg{width:32px;height:32px;color:#3b82f6}
h1{font-size:2rem;font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#3b82f6,#10b981);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.version{margin-top:.5rem;font-size:.85rem;color:#64748b;font-weight:500;letter-spacing:.05em}
.links{margin-top:2rem;display:flex;gap:.75rem;justify-content:center;flex-wrap:wrap}
.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.5rem;border-radius:10px;font-size:.875rem;font-weight:600;text-decoration:none;transition:all .2s}
.btn-primary{background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;box-shadow:0 4px 15px rgba(59,130,246,.25)}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(59,130,246,.35)}
.btn-secondary{background:rgba(59,130,246,.08);color:#3b82f6;border:1px solid rgba(59,130,246,.2)}
.btn-secondary:hover{background:rgba(59,130,246,.15);border-color:rgba(59,130,246,.4)}
.sign{margin-top:3rem;font-size:.75rem;color:#475569}
.sign a{color:#3b82f6;text-decoration:none;transition:color .15s}
.sign a:hover{color:#60a5fa}
.orb{position:fixed;border-radius:50%;filter:blur(80px);pointer-events:none;opacity:.4;animation:float 20s ease-in-out infinite}
.orb-1{width:300px;height:300px;background:rgba(59,130,246,.12);top:-100px;left:-80px;animation-duration:18s}
.orb-2{width:250px;height:250px;background:rgba(16,185,129,.1);bottom:-80px;right:-60px;animation-duration:22s;animation-direction:reverse}
@keyframes float{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.05)}}
</style>
</head>
<body>
<div class="orb orb-1"></div>
<div class="orb orb-2"></div>
<div class="container">
<div class="pulse-ring">
<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
</div>
<h1>IoT Dashboard API</h1>
<p class="version">v${pkgJson.version}</p>
<div class="links">
<a href="/api-docs" class="btn btn-primary">API Documentation</a>
<a href="/api/health" class="btn btn-secondary">Health Check</a>
</div>
<footer class="sign">
Created by
<a href="https://serkanbayraktar.com/" target="_blank" rel="noopener noreferrer">Serkanby</a>
|
<a href="https://github.com/Serkanbyx" target="_blank" rel="noopener noreferrer">Github</a>
</footer>
</div>
</body>
</html>`);
});

// --- Health Check ---
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// --- Routes ---
app.use("/api/auth", authRoutes);
app.use("/api/thresholds", thresholdRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/devices", deviceRoutes);

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
