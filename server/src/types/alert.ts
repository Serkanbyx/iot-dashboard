export type SensorTypeEnum = "TEMPERATURE" | "HUMIDITY" | "PRESSURE";
export type SeverityValue = "WARNING" | "CRITICAL";
export type DirectionValue = "ABOVE" | "BELOW";

export interface AlertPayload {
  id: string;
  sensorId: string;
  floor: string;
  sensorType: SensorTypeEnum;
  value: number;
  threshold: number;
  severity: SeverityValue;
  direction: DirectionValue;
  message: string;
  isAcknowledged: boolean;
  emailSent: boolean;
  createdAt: string;
}
