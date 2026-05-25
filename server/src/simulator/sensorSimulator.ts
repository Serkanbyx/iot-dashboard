import mqtt from "mqtt";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// --- Types ---

interface SensorConfig {
  sensorId: string;
  floor: string;
}

interface GeneratorConfig {
  base: number;
  min: number;
  max: number;
  spikeValue: number;
  spikeChance: number;
}

type SensorType = "temperature" | "humidity" | "pressure";

// --- Configuration ---

const PUBLISH_INTERVAL_MS = 3000;

const SENSORS: SensorConfig[] = [
  { sensorId: "sensor01", floor: "floor1" },
  { sensorId: "sensor02", floor: "floor1" },
  { sensorId: "sensor03", floor: "floor2" },
  { sensorId: "sensor04", floor: "floor2" },
  { sensorId: "sensor05", floor: "floor3" },
  { sensorId: "sensor06", floor: "floor3" },
];

const GENERATORS: Record<SensorType, GeneratorConfig> = {
  temperature: { base: 22, min: 18, max: 35, spikeValue: 47.5, spikeChance: 0.05 },
  humidity:    { base: 55, min: 30, max: 80, spikeValue: 95,   spikeChance: 0.05 },
  pressure:    { base: 1013, min: 990, max: 1040, spikeValue: 947.5, spikeChance: 0.03 },
};

const UNITS: Record<SensorType, string> = {
  temperature: "°C",
  humidity: "%",
  pressure: "hPa",
};

const SENSOR_TYPES: SensorType[] = ["temperature", "humidity", "pressure"];

// --- Value generation ---

function generateValue(gen: GeneratorConfig): number {
  if (Math.random() < gen.spikeChance) {
    const halfRange = Math.abs(gen.spikeValue - gen.base) * 0.1;
    return +(gen.spikeValue + (Math.random() * halfRange * 2 - halfRange)).toFixed(2);
  }

  const range = gen.max - gen.min;
  const drift = (Math.random() - 0.5) * range;
  const value = gen.base + drift;
  return +Math.max(gen.min, Math.min(gen.max, value)).toFixed(2);
}

// --- MQTT connection ---

const brokerUrl = process.env.MQTT_BROKER_URL ?? "mqtt://localhost:1883";
const topicRoot = process.env.MQTT_TOPIC_ROOT ?? "factory";
const randomSuffix = Math.random().toString(36).substring(2, 10);

const connectOptions: mqtt.IClientOptions = {
  clientId: `iot-simulator-${randomSuffix}`,
  clean: true,
  reconnectPeriod: 5000,
};

if (process.env.MQTT_USERNAME && process.env.MQTT_PASSWORD) {
  connectOptions.username = process.env.MQTT_USERNAME;
  connectOptions.password = process.env.MQTT_PASSWORD;
}

const client = mqtt.connect(brokerUrl, connectOptions);
let intervalId: ReturnType<typeof setInterval> | null = null;

function publishReadings(): void {
  const timestamp = new Date().toISOString();

  for (const sensor of SENSORS) {
    for (const type of SENSOR_TYPES) {
      const topic = `${topicRoot}/${sensor.floor}/${sensor.sensorId}/${type}`;
      const payload = JSON.stringify({
        sensorId: sensor.sensorId,
        floor: sensor.floor,
        type,
        value: generateValue(GENERATORS[type]),
        unit: UNITS[type],
        timestamp,
      });

      client.publish(topic, payload, { qos: 0 });
    }
  }

  const count = SENSORS.length * SENSOR_TYPES.length;
  console.log(`[SIMULATOR] Published ${count} readings at ${timestamp}`);
}

// --- Lifecycle ---

client.on("connect", () => {
  console.log(`[SIMULATOR] Connected to ${brokerUrl}`);
  console.log(`[SIMULATOR] Publishing ${SENSORS.length} sensors × ${SENSOR_TYPES.length} types every ${PUBLISH_INTERVAL_MS / 1000}s`);

  publishReadings();
  intervalId = setInterval(publishReadings, PUBLISH_INTERVAL_MS);
});

client.on("error", (err) => {
  console.error("[SIMULATOR] MQTT error:", err.message);
});

client.on("reconnect", () => {
  console.log("[SIMULATOR] Reconnecting…");
});

function shutdown(): void {
  console.log("\n[SIMULATOR] Shutting down…");
  if (intervalId) clearInterval(intervalId);
  client.end(false, () => {
    console.log("[SIMULATOR] Disconnected");
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
