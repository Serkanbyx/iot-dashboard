import api from "./axios";
import type { SensorReading, AggregatedReading, SensorInfo } from "../types";

interface HistoryParams {
  sensorId: string;
  type: string;
  start?: string;
  stop?: string;
}

interface AggregatedParams extends HistoryParams {
  window?: "minute" | "hour";
}

interface FloorData {
  floor: string;
  readings: SensorReading[];
}

export async function getLatestReadings(): Promise<{ readings: SensorReading[] }> {
  const { data } = await api.get<{ readings: SensorReading[] }>("/sensors/latest");
  return data;
}

export async function getSensorHistory(params: HistoryParams): Promise<{ readings: SensorReading[] }> {
  const { data } = await api.get<{ readings: SensorReading[] }>("/sensors/history", { params });
  return data;
}

export async function getAggregatedData(params: AggregatedParams): Promise<{ data: AggregatedReading[] }> {
  const { data } = await api.get<{ data: AggregatedReading[] }>("/sensors/aggregated", { params });
  return data;
}

export async function getSensorList(): Promise<{ sensors: SensorInfo[] }> {
  const { data } = await api.get<{ sensors: SensorInfo[] }>("/sensors/list");
  return data;
}

export async function getFloorOverview(): Promise<{ floors: FloorData[] }> {
  const { data } = await api.get<{ floors: FloorData[] }>("/sensors/floors");
  return data;
}
