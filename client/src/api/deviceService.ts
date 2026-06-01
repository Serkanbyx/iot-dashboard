import api from "./axios";
import type { Device, CreateDevicePayload, UpdateDevicePayload } from "../types";

export async function getDevices(
  floor?: string
): Promise<{ devices: Device[] }> {
  const { data } = await api.get<{ devices: Device[] }>("/devices", {
    params: floor ? { floor } : undefined,
  });
  return data;
}

export async function getDevice(id: string): Promise<{ device: Device }> {
  const { data } = await api.get<{ device: Device }>(`/devices/${id}`);
  return data;
}

export async function createDevice(
  payload: CreateDevicePayload
): Promise<{ device: Device }> {
  const { data } = await api.post<{ device: Device }>("/devices", payload);
  return data;
}

export async function updateDevice(
  id: string,
  payload: UpdateDevicePayload
): Promise<{ device: Device }> {
  const { data } = await api.patch<{ device: Device }>(
    `/devices/${id}`,
    payload
  );
  return data;
}

export async function deleteDevice(
  id: string
): Promise<{ message: string }> {
  const { data } = await api.delete<{ message: string }>(`/devices/${id}`);
  return data;
}
