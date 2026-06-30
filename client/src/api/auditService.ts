import api from "./axios";

export interface AuditLogEntry {
  id: string;
  entityType: "DEVICE" | "THRESHOLD" | "USER";
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE";
  summary: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
}

export interface AuditLogsResponse {
  logs: AuditLogEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export async function getAuditLogs(page = 1): Promise<AuditLogsResponse> {
  const { data } = await api.get<AuditLogsResponse>("/audit", {
    params: { page, limit: 25 },
  });
  return data;
}
