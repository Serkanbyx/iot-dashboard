import api from "./axios";
import type { Alert, AlertStats, AlertsResponse, AlertFilters } from "../types";

export async function getAlerts(filters?: AlertFilters): Promise<AlertsResponse> {
  const { data } = await api.get<AlertsResponse>("/alerts", { params: filters });
  return data;
}

export async function getAlertStats(): Promise<AlertStats> {
  const { data } = await api.get<AlertStats>("/alerts/stats");
  return data;
}

export async function acknowledgeAlert(alertId: string): Promise<{ alert: Alert }> {
  const { data } = await api.patch<{ alert: Alert }>(`/alerts/${alertId}/acknowledge`);
  return data;
}

export async function acknowledgeAll(): Promise<{ acknowledged: number }> {
  const { data } = await api.patch<{ acknowledged: number }>("/alerts/acknowledge-all");
  return data;
}

export async function deleteOldAlerts(days?: number): Promise<{ deleted: number; olderThan: string }> {
  const { data } = await api.delete<{ deleted: number; olderThan: string }>("/alerts/cleanup", {
    params: days ? { days } : undefined,
  });
  return data;
}
