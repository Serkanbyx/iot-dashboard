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
  payload: UpdateThresholdPayload,
  sensorId = ""
): Promise<{ threshold: ThresholdConfig }> {
  const path = sensorId
    ? `/thresholds/${sensorType}/device/${sensorId}`
    : `/thresholds/${sensorType}`;

  const { data } = await api.patch<{ threshold: ThresholdConfig }>(path, payload);
  return data;
}

export async function deleteDeviceThreshold(
  sensorType: string,
  sensorId: string
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(
    `/thresholds/${sensorType}/device/${sensorId}`
  );
  return data;
}
