import { describe, expect, it } from "vitest";
import {
  buildAcknowledgedAlertsCleanupWhere,
  buildAlertAcknowledgedPayload,
  buildAlertBulkAcknowledgedPayload,
  buildAlertNewPayload,
  resolveCleanupDays,
} from "../src/utils/alertEvents.js";

describe("alert cleanup filter (P0 #2)", () => {
  it("only deletes acknowledged alerts older than the cutoff", () => {
    const where = buildAcknowledgedAlertsCleanupWhere(30);

    expect(where.isAcknowledged).toBe(true);
    expect(where.createdAt.lt.getTime()).toBeLessThan(Date.now());
  });

  it("clamps cleanup days between 1 and 365", () => {
    expect(resolveCleanupDays(999)).toBe(365);
    expect(resolveCleanupDays(undefined)).toBe(30);
    expect(resolveCleanupDays(0)).toBe(30);
  });
});

describe("socket alert payloads (P0 #1, #3, P2 #11)", () => {
  it("emits alertId and acknowledgedBy on single acknowledge", () => {
    expect(buildAlertAcknowledgedPayload("alert-1", "Admin")).toEqual({
      alertId: "alert-1",
      acknowledgedBy: "Admin",
    });
  });

  it("emits acknowledgedBy and count on bulk acknowledge", () => {
    expect(buildAlertBulkAcknowledgedPayload("Admin", 4)).toEqual({
      acknowledgedBy: "Admin",
      count: 4,
    });
  });

  it("keeps uppercase sensorType on alert:new payload", () => {
    const payload = buildAlertNewPayload({
      id: "a1",
      sensorId: "sensor01",
      floor: "floor1",
      sensorType: "TEMPERATURE",
      value: 36,
      threshold: 35,
      severity: "WARNING",
      direction: "ABOVE",
      message: "Too hot",
      isAcknowledged: false,
      emailSent: false,
      createdAt: new Date("2026-06-30T12:00:00.000Z"),
    });

    expect(payload.sensorType).toBe("TEMPERATURE");
    expect(payload.createdAt).toBe("2026-06-30T12:00:00.000Z");
  });
});
