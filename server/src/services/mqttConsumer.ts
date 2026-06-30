import mqtt from "mqtt";
import type { Server } from "socket.io";
import mqttConfig from "../config/mqtt.js";
import prisma from "../config/database.js";
import { processReading } from "./alertEngine.js";
import type { SensorReading, SensorTypeValue } from "../types/sensor.js";

const VALID_SENSOR_TYPES: SensorTypeValue[] = ["temperature", "humidity", "pressure"];

let deviceCache: Set<string> = new Set();

export async function refreshDeviceCache(): Promise<void> {
  const devices = await prisma.device.findMany({
    where: { isActive: true },
    select: { sensorId: true },
  });

  deviceCache = new Set(devices.map((d) => d.sensorId));
}

function isDeviceAllowed(sensorId: string): boolean {
  return deviceCache.has(sensorId);
}

function isValidSensorReading(data: unknown): data is SensorReading {
  if (typeof data !== "object" || data === null) return false;

  const obj = data as Record<string, unknown>;

  return (
    typeof obj.sensorId === "string" &&
    obj.sensorId.length > 0 &&
    typeof obj.floor === "string" &&
    obj.floor.length > 0 &&
    typeof obj.type === "string" &&
    VALID_SENSOR_TYPES.includes(obj.type as SensorTypeValue) &&
    typeof obj.value === "number" &&
    Number.isFinite(obj.value) &&
    typeof obj.unit === "string" &&
    obj.unit.length > 0 &&
    typeof obj.timestamp === "string" &&
    !Number.isNaN(Date.parse(obj.timestamp))
  );
}

async function insertReading(reading: SensorReading): Promise<void> {
  await prisma.$executeRawUnsafe(
    `INSERT INTO sensor_readings (time, sensor_id, floor, sensor_type, value, unit)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    new Date(reading.timestamp),
    reading.sensorId,
    reading.floor,
    reading.type,
    reading.value,
    reading.unit
  );
}

export function startMqttConsumer(io: Server): void {
  const { brokerUrl, options, topicRoot } = mqttConfig;
  const client = mqtt.connect(brokerUrl, options);

  const wildcardTopic = `${topicRoot}/+/+/+`;

  client.on("connect", async () => {
    console.log(`[MQTT] Connected to ${brokerUrl}`);

    await refreshDeviceCache();

    client.subscribe(wildcardTopic, { qos: 0 }, (err) => {
      if (err) {
        console.error("[MQTT] Subscribe error:", err.message);
        return;
      }
      console.log(`[MQTT] Subscribed to ${wildcardTopic}`);
    });
  });

  client.on("message", async (_topic, payload) => {
    try {
      const data: unknown = JSON.parse(payload.toString());

      if (!isValidSensorReading(data)) {
        console.warn("[MQTT] Invalid reading, skipping");
        return;
      }

      if (!isDeviceAllowed(data.sensorId)) {
        return;
      }

      await insertReading(data);

      io.to("dashboard").emit("sensor:data", data);

      await processReading(data, io);
    } catch (error) {
      if (error instanceof SyntaxError) {
        console.warn("[MQTT] Invalid JSON payload, skipping");
      } else {
        console.error("[MQTT] Processing error:", (error as Error).message);
      }
    }
  });

  client.on("error", (err) => {
    console.error("[MQTT] Connection error:", err.message);
  });

  client.on("reconnect", () => {
    console.log("[MQTT] Reconnecting…");
  });

  client.on("offline", () => {
    console.warn("[MQTT] Client offline");
  });
}
