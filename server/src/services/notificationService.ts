import config from "../config/env.js";
import { sendAlertEmail } from "./emailService.js";

export interface AlertNotificationPayload {
  sensorId: string;
  floor: string;
  sensorType: string;
  value: number;
  unit: string;
  threshold: number;
  severity: string;
  direction: string;
  message: string;
}

export interface NotificationResult {
  email: boolean;
  slack: boolean;
  webhook: boolean;
}

async function sendSlackNotification(
  alert: AlertNotificationPayload
): Promise<boolean> {
  const webhookUrl = config.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${alert.severity}] ${alert.message}`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${alert.severity}* — ${alert.sensorType} on *${alert.sensorId}* (${alert.floor})\n${alert.value}${alert.unit} (limit: ${alert.threshold}${alert.unit})`,
            },
          },
        ],
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[SLACK] Failed to send:", (error as Error).message);
    return false;
  }
}

async function sendWebhookNotification(
  alert: AlertNotificationPayload
): Promise<boolean> {
  const webhookUrl = config.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return false;

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "alert.critical",
        timestamp: new Date().toISOString(),
        alert,
      }),
    });

    return response.ok;
  } catch (error) {
    console.error("[WEBHOOK] Failed to send:", (error as Error).message);
    return false;
  }
}

export async function sendAlertNotifications(
  alert: AlertNotificationPayload
): Promise<NotificationResult> {
  const [email, slack, webhook] = await Promise.all([
    sendAlertEmail(alert),
    sendSlackNotification(alert),
    sendWebhookNotification(alert),
  ]);

  if (slack) console.log(`[SLACK] Alert sent for ${alert.sensorId}:${alert.sensorType}`);
  if (webhook) console.log(`[WEBHOOK] Alert sent for ${alert.sensorId}:${alert.sensorType}`);

  return { email, slack, webhook };
}
