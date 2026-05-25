export type SensorTypeValue = "temperature" | "humidity" | "pressure";

export interface SensorReading {
  sensorId: string;
  floor: string;
  type: SensorTypeValue;
  value: number;
  unit: string;
  timestamp: string;
}

export interface AggregatedReading {
  bucket: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  readingCount: number;
}

export interface SensorInfo {
  sensorId: string;
  floor: string;
  lastSeen: string;
}
