export function buildDeviceWhitelist(activeSensorIds: string[]): Set<string> {
  return new Set(activeSensorIds);
}

export function isDeviceWhitelisted(
  sensorId: string,
  allowedSensorIds: ReadonlySet<string>
): boolean {
  return allowedSensorIds.has(sensorId);
}
