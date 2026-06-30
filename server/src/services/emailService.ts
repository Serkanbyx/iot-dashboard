import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import config from "../config/env.js";
import { escapeHtml } from "../utils/escapeHtml.js";

interface AlertEmailPayload {
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

const EMAIL_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes per sensor
const cooldownMap = new Map<string, number>();

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: false,
      auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS,
      },
    });
  }
  return transporter;
}

function getCooldownKey(sensorId: string, sensorType: string): string {
  return `${sensorId}:${sensorType}`;
}

function isOnCooldown(sensorId: string, sensorType: string): boolean {
  const lastSent = cooldownMap.get(getCooldownKey(sensorId, sensorType));

  if (!lastSent) {
    return false;
  }

  return Date.now() - lastSent < EMAIL_COOLDOWN_MS;
}

function markEmailSent(sensorId: string, sensorType: string): void {
  cooldownMap.set(getCooldownKey(sensorId, sensorType), Date.now());
}

export async function sendAlertEmail(alert: AlertEmailPayload): Promise<boolean> {
  if (isOnCooldown(alert.sensorId, alert.sensorType)) {
    console.log(`[EMAIL] Cooldown active for ${alert.sensorId}:${alert.sensorType}, skipping`);
    return false;
  }

  if (!config.SMTP_USER || !config.SMTP_PASS) {
    console.warn("[EMAIL] SMTP credentials not configured, skipping email");
    return false;
  }

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #dc2626; color: white; padding: 16px 24px; border-radius: 8px 8px 0 0;">
        <h2 style="margin: 0;">⚠️ IoT Alert: ${escapeHtml(alert.severity)}</h2>
      </div>
      <div style="background: #fef2f2; padding: 24px; border: 1px solid #fecaca; border-radius: 0 0 8px 8px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold;">Sensor:</td><td>${escapeHtml(alert.sensorId)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Floor:</td><td>${escapeHtml(alert.floor)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Type:</td><td>${escapeHtml(alert.sensorType)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Value:</td><td>${alert.value} ${escapeHtml(alert.unit)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Threshold:</td><td>${alert.threshold} ${escapeHtml(alert.unit)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Direction:</td><td>${escapeHtml(alert.direction)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold;">Time:</td><td>${escapeHtml(new Date().toISOString())}</td></tr>
        </table>
        <p style="margin-top: 16px; color: #991b1b;">${escapeHtml(alert.message)}</p>
      </div>
    </div>
  `;

  try {
    await getTransporter().sendMail({
      from: config.ALERT_EMAIL_FROM,
      to: config.ALERT_EMAIL_TO,
      subject: `[CRITICAL] IoT Alert: ${escapeHtml(alert.sensorType)} on ${escapeHtml(alert.sensorId)}`,
      html,
    });
    markEmailSent(alert.sensorId, alert.sensorType);
    console.log(`[EMAIL] Alert sent for ${alert.sensorId}:${alert.sensorType}`);
    return true;
  } catch (error) {
    console.error("[EMAIL] Failed to send:", (error as Error).message);
    return false;
  }
}
