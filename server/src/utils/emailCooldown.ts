export const EMAIL_COOLDOWN_MS = 5 * 60 * 1000;
export const EMAIL_MAX_RETRIES = 3;
export const EMAIL_RETRY_BASE_DELAY_MS = 2_000;

export function getEmailCooldownKey(
  sensorId: string,
  sensorType: string
): string {
  return `${sensorId}:${sensorType}`;
}

export function isOnEmailCooldown(
  sensorId: string,
  sensorType: string,
  cooldownMap: Map<string, number>,
  now = Date.now()
): boolean {
  const lastSent = cooldownMap.get(getEmailCooldownKey(sensorId, sensorType));

  if (!lastSent) {
    return false;
  }

  return now - lastSent < EMAIL_COOLDOWN_MS;
}

export function markEmailCooldown(
  sensorId: string,
  sensorType: string,
  cooldownMap: Map<string, number>,
  now = Date.now()
): void {
  cooldownMap.set(getEmailCooldownKey(sensorId, sensorType), now);
}

export function getEmailRetryDelayMs(attempt: number): number {
  return EMAIL_RETRY_BASE_DELAY_MS * attempt;
}
