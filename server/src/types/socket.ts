import type { SensorReading } from "./sensor.js";
import type { AlertPayload } from "./alert.js";

export interface ServerToClientEvents {
  "sensor:data": (data: SensorReading) => void;
  "alert:new": (alert: AlertPayload) => void;
  "alert:acknowledged": (data: {
    alertId: string;
    acknowledgedBy: string;
  }) => void;
  "alert:bulk-acknowledged": (data: {
    acknowledgedBy: string;
    count: number;
  }) => void;
}

export interface ClientToServerEvents {
  // No client → server events; all realtime data uses the shared "dashboard" room.
}
