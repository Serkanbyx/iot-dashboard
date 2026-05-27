export interface Alert {
  id: string;
  sensorId: string;
  floor: string;
  sensorType: "TEMPERATURE" | "HUMIDITY" | "PRESSURE";
  value: number;
  threshold: number;
  severity: "WARNING" | "CRITICAL";
  direction: "ABOVE" | "BELOW";
  message: string;
  isAcknowledged: boolean;
  acknowledgedById: string | null;
  acknowledgedAt: string | null;
  emailSent: boolean;
  createdAt: string;
}

export interface AlertStats {
  total: number;
  unacknowledged: number;
  bySeverity: Record<string, number>;
  byType: Record<string, number>;
  last24h: number;
}

export interface ThresholdConfig {
  id: string;
  sensorType: string;
  minValue: number;
  maxValue: number;
  criticalMin: number;
  criticalMax: number;
  unit: string;
  isActive: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  pagination: Pagination;
}

export interface AlertFilters {
  page?: number;
  limit?: number;
  severity?: string;
  sensorType?: string;
  isAcknowledged?: string;
  sensorId?: string;
  sort?: string;
  order?: string;
}
