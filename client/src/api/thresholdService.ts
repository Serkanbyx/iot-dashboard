import api from "./axios";
import type { ThresholdConfig } from "../types";

interface UpdateThresholdPayload {
  minValue: number;
  maxValue: number;
  criticalMin: number;
  criticalMax: number;
  isActive?: boolean;
}

export async function getAllThresholds(): Promise<{ thresholds: ThresholdConfig[] }> {
  const { data } = await api.get<{ thresholds: ThresholdConfig[] }>("/thresholds");
  return data;
}

export async function updateThreshold(
  sensorType: string,
  payload: UpdateThresholdPayload
): Promise<{ threshold: ThresholdConfig }> {
  const { data } = await api.patch<{ threshold: ThresholdConfig }>(
    `/thresholds/${sensorType}`,
    payload
  );
  return data;
}
