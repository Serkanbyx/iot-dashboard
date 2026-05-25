import type { SensorReading } from "./sensor.js";
import type { AlertPayload } from "./alert.js";

export interface ServerToClientEvents {
  "sensor:data": (data: SensorReading) => void;
  "alert:new": (alert: AlertPayload) => void;
  "alert:acknowledged": (data: {
    alertId: string;
    acknowledgedBy: string;
  }) => void;
}

export interface ClientToServerEvents {
  "subscribe:floor": (floor: string) => void;
  "unsubscribe:floor": (floor: string) => void;
}
