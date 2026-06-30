import { describe, expect, it } from "vitest";
import {
  buildDeviceWhitelist,
  isDeviceWhitelisted,
} from "../src/utils/deviceWhitelist.js";

describe("device whitelist", () => {
  it("denies all sensors when the whitelist is empty", () => {
    const whitelist = buildDeviceWhitelist([]);

    expect(isDeviceWhitelisted("sensor01", whitelist)).toBe(false);
  });

  it("allows only registered active sensor IDs", () => {
    const whitelist = buildDeviceWhitelist(["sensor01", "sensor03"]);

    expect(isDeviceWhitelisted("sensor01", whitelist)).toBe(true);
    expect(isDeviceWhitelisted("sensor02", whitelist)).toBe(false);
  });
});
