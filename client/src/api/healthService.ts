import api from "./axios";

export interface HealthStatus {
  status: string;
  uptime: number;
}

export async function getHealth(): Promise<HealthStatus> {
  const { data } = await api.get<HealthStatus>("/health");
  return data;
}
