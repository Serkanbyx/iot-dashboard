import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export interface EnvConfig {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
  DATABASE_URL: string;
  MQTT_BROKER_URL: string;
  MQTT_USERNAME: string;
  MQTT_PASSWORD: string;
  MQTT_TOPIC_ROOT: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  CLIENT_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_USER: string;
  SMTP_PASS: string;
  ALERT_EMAIL_FROM: string;
  ALERT_EMAIL_TO: string;
  ALLOW_REGISTRATION: boolean;
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === "") return defaultValue;
  return value === "true" || value === "1";
}

const MIN_JWT_SECRET_LENGTH = 32;

function loadConfig(): EnvConfig {
  const env = process.env;

  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  const nodeEnv = (env.NODE_ENV ?? "development") as EnvConfig["NODE_ENV"];
  const jwtSecret = env.JWT_SECRET ?? "";

  if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`
    );
  }

  return {
    PORT: Number(env.PORT) || 5000,
    NODE_ENV: nodeEnv,
    DATABASE_URL: env.DATABASE_URL,
    MQTT_BROKER_URL: env.MQTT_BROKER_URL ?? "mqtt://localhost:1883",
    MQTT_USERNAME: env.MQTT_USERNAME ?? "",
    MQTT_PASSWORD: env.MQTT_PASSWORD ?? "",
    MQTT_TOPIC_ROOT: env.MQTT_TOPIC_ROOT ?? "factory",
    JWT_SECRET: jwtSecret,
    JWT_EXPIRES_IN: env.JWT_EXPIRES_IN ?? "7d",
    CLIENT_URL: env.CLIENT_URL ?? "http://localhost:5173",
    SMTP_HOST: env.SMTP_HOST ?? "smtp.gmail.com",
    SMTP_PORT: Number(env.SMTP_PORT) || 587,
    SMTP_USER: env.SMTP_USER ?? "",
    SMTP_PASS: env.SMTP_PASS ?? "",
    ALERT_EMAIL_FROM: env.ALERT_EMAIL_FROM ?? "",
    ALERT_EMAIL_TO: env.ALERT_EMAIL_TO ?? "",
    ALLOW_REGISTRATION: parseBoolean(
      env.ALLOW_REGISTRATION,
      nodeEnv !== "production"
    ),
  };
}

const config: Readonly<EnvConfig> = Object.freeze(loadConfig());

export default config;
