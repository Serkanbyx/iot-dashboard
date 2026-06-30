import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : "/api";

const HEALTH_TIMEOUT_MS = 45_000;
const WAKE_MAX_ATTEMPTS = 6;
const WAKE_RETRY_DELAY_MS = 3_000;

const healthClient = axios.create({
  baseURL,
  timeout: HEALTH_TIMEOUT_MS,
});

export interface HealthStatus {
  status: string;
  uptime: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pingHealth(): Promise<HealthStatus> {
  const { data } = await healthClient.get<HealthStatus>("/health");
  return data;
}

export const getHealth = pingHealth;

export async function wakeBackend(): Promise<HealthStatus> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= WAKE_MAX_ATTEMPTS; attempt++) {
    try {
      return await pingHealth();
    } catch (error) {
      lastError = error;
      if (attempt < WAKE_MAX_ATTEMPTS) {
        await delay(WAKE_RETRY_DELAY_MS);
      }
    }
  }

  throw lastError;
}
