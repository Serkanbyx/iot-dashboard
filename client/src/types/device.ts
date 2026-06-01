export interface Device {
  id: string;
  sensorId: string;
  name: string;
  floor: string;
  types: ("TEMPERATURE" | "HUMIDITY" | "PRESSURE")[];
  isActive: boolean;
  createdAt: string;
}

export interface CreateDevicePayload {
  sensorId: string;
  name: string;
  floor: string;
  types: string[];
}

export interface UpdateDevicePayload {
  name?: string;
  floor?: string;
  types?: string[];
  isActive?: boolean;
}
