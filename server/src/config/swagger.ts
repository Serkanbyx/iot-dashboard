import swaggerUi from "swagger-ui-express";
import type { Express } from "express";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(
  readFileSync(resolve(__dirname, "../../package.json"), "utf-8")
);

const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "IoT Dashboard API",
    version: pkg.version,
    description:
      "Real-time IoT sensor monitoring backend — Express 5, Prisma, MQTT, Socket.io.",
    contact: {
      name: "Serkanby",
      url: "https://serkanbayraktar.com/",
    },
  },
  servers: [
    { url: "/api", description: "API base" },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: "http" as const,
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
  },
  security: [{ BearerAuth: [] }],
  paths: {
    "/health": {
      get: {
        tags: ["System"],
        summary: "Health check",
        security: [],
        responses: { "200": { description: "Server status and uptime" } },
      },
    },
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["name", "email", "password"],
                properties: {
                  name: { type: "string", example: "John Doe" },
                  email: { type: "string", format: "email", example: "john@example.com" },
                  password: { type: "string", minLength: 6, example: "secret123" },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "User created with JWT token" },
          "409": { description: "Email already exists" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login and receive JWT token",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          "200": { description: "JWT token and user object" },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Get current user profile",
        responses: { "200": { description: "User object" } },
      },
    },
    "/sensors/latest": {
      get: {
        tags: ["Sensors"],
        summary: "Latest reading per sensor+type (last 5 min)",
        responses: { "200": { description: "Array of latest readings" } },
      },
    },
    "/sensors/history": {
      get: {
        tags: ["Sensors"],
        summary: "Raw history for a sensor+type",
        parameters: [
          { name: "sensorId", in: "query", required: true, schema: { type: "string" } },
          { name: "type", in: "query", required: true, schema: { type: "string", enum: ["temperature", "humidity", "pressure"] } },
          { name: "start", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "stop", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Array of readings" } },
      },
    },
    "/sensors/aggregated": {
      get: {
        tags: ["Sensors"],
        summary: "Aggregated stats (avg/min/max) by time window",
        parameters: [
          { name: "sensorId", in: "query", required: true, schema: { type: "string" } },
          { name: "type", in: "query", required: true, schema: { type: "string" } },
          { name: "window", in: "query", schema: { type: "string", enum: ["minute", "hour"] } },
          { name: "start", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "stop", in: "query", schema: { type: "string", format: "date-time" } },
        ],
        responses: { "200": { description: "Aggregated data buckets" } },
      },
    },
    "/sensors/list": {
      get: {
        tags: ["Sensors"],
        summary: "Distinct sensors seen in last hour",
        responses: { "200": { description: "Array of sensor info" } },
      },
    },
    "/alerts": {
      get: {
        tags: ["Alerts"],
        summary: "List alerts with pagination and filters",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "severity", in: "query", schema: { type: "string", enum: ["WARNING", "CRITICAL"] } },
          { name: "sensorType", in: "query", schema: { type: "string" } },
          { name: "isAcknowledged", in: "query", schema: { type: "string", enum: ["true", "false"] } },
        ],
        responses: { "200": { description: "Paginated alerts with stats" } },
      },
    },
    "/alerts/stats": {
      get: {
        tags: ["Alerts"],
        summary: "Alert statistics (total, unacknowledged, by severity)",
        responses: { "200": { description: "Alert stats object" } },
      },
    },
    "/alerts/{id}/acknowledge": {
      patch: {
        tags: ["Alerts"],
        summary: "Acknowledge a single alert (admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Updated alert" },
          "403": { description: "Admin access required" },
        },
      },
    },
    "/alerts/acknowledge-all": {
      patch: {
        tags: ["Alerts"],
        summary: "Acknowledge all alerts (admin)",
        responses: { "200": { description: "Count of acknowledged alerts" } },
      },
    },
    "/thresholds": {
      get: {
        tags: ["Thresholds"],
        summary: "Get all threshold configurations",
        responses: { "200": { description: "Array of threshold configs" } },
      },
    },
    "/thresholds/{sensorType}": {
      patch: {
        tags: ["Thresholds"],
        summary: "Update threshold for a sensor type (admin)",
        parameters: [{ name: "sensorType", in: "path", required: true, schema: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "PRESSURE"] } }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  minValue: { type: "number" },
                  maxValue: { type: "number" },
                  criticalMin: { type: "number" },
                  criticalMax: { type: "number" },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated threshold" } },
      },
    },
    "/devices": {
      get: {
        tags: ["Devices"],
        summary: "List all registered devices",
        parameters: [{ name: "floor", in: "query", schema: { type: "string" } }],
        responses: { "200": { description: "Array of devices" } },
      },
      post: {
        tags: ["Devices"],
        summary: "Register a new device (admin)",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["sensorId", "name", "floor", "types"],
                properties: {
                  sensorId: { type: "string", example: "sensor-07" },
                  name: { type: "string", example: "Warehouse Sensor 07" },
                  floor: { type: "string", example: "floor1" },
                  types: { type: "array", items: { type: "string", enum: ["TEMPERATURE", "HUMIDITY", "PRESSURE"] } },
                },
              },
            },
          },
        },
        responses: {
          "201": { description: "Created device" },
          "409": { description: "sensorId already exists" },
        },
      },
    },
    "/devices/{id}": {
      get: {
        tags: ["Devices"],
        summary: "Get a single device",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Device object" } },
      },
      patch: {
        tags: ["Devices"],
        summary: "Update a device (admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  floor: { type: "string" },
                  types: { type: "array", items: { type: "string" } },
                  isActive: { type: "boolean" },
                },
              },
            },
          },
        },
        responses: { "200": { description: "Updated device" } },
      },
      delete: {
        tags: ["Devices"],
        summary: "Delete a device (admin)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Device deleted" } },
      },
    },
  },
  tags: [
    { name: "System", description: "Health and status" },
    { name: "Auth", description: "Authentication and user management" },
    { name: "Sensors", description: "Sensor readings and history" },
    { name: "Alerts", description: "Alert management" },
    { name: "Thresholds", description: "Threshold configuration" },
    { name: "Devices", description: "Device registry" },
  ],
};

export function setupSwagger(app: Express): void {
  app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
      customSiteTitle: "IoT Dashboard API Docs",
      customCss: ".swagger-ui .topbar { display: none }",
    })
  );
}
