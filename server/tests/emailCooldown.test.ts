import { describe, expect, it } from "vitest";
import {
  EMAIL_COOLDOWN_MS,
  getEmailCooldownKey,
  getEmailRetryDelayMs,
  isOnEmailCooldown,
  markEmailCooldown,
} from "../src/utils/emailCooldown.js";

describe("email cooldown", () => {
  it("builds a stable cooldown key per sensor and type", () => {
    expect(getEmailCooldownKey("sensor01", "temperature")).toBe(
      "sensor01:temperature"
    );
  });

  it("blocks duplicate sends during the cooldown window", () => {
    const cooldownMap = new Map<string, number>();
    const now = Date.now();

    markEmailCooldown("sensor01", "temperature", cooldownMap, now);

    expect(
      isOnEmailCooldown("sensor01", "temperature", cooldownMap, now + 1000)
    ).toBe(true);
    expect(
      isOnEmailCooldown(
        "sensor01",
        "temperature",
        cooldownMap,
        now + EMAIL_COOLDOWN_MS
      )
    ).toBe(false);
  });

  it("does not start cooldown until markEmailCooldown is called", () => {
    const cooldownMap = new Map<string, number>();

    expect(isOnEmailCooldown("sensor01", "temperature", cooldownMap)).toBe(
      false
    );
  });

  it("uses linear retry delays", () => {
    expect(getEmailRetryDelayMs(1)).toBe(2_000);
    expect(getEmailRetryDelayMs(2)).toBe(4_000);
    expect(getEmailRetryDelayMs(3)).toBe(6_000);
  });
});
