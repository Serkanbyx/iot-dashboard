import { describe, expect, it } from "vitest";
import { evaluateReadingAgainstThreshold } from "../src/services/alertEngine.js";

const temperatureThreshold = {
  minValue: 15,
  maxValue: 35,
  criticalMin: 5,
  criticalMax: 45,
  unit: "°C",
  isActive: true,
};

describe("evaluateReadingAgainstThreshold", () => {
  it("returns null for normal readings", () => {
    expect(
      evaluateReadingAgainstThreshold(22, temperatureThreshold)
    ).toBeNull();
  });

  it("returns warning when value exceeds maxValue", () => {
    expect(evaluateReadingAgainstThreshold(36, temperatureThreshold)).toEqual({
      severity: "WARNING",
      direction: "ABOVE",
      thresholdValue: 35,
    });
  });

  it("returns warning when value falls below minValue", () => {
    expect(evaluateReadingAgainstThreshold(14, temperatureThreshold)).toEqual({
      severity: "WARNING",
      direction: "BELOW",
      thresholdValue: 15,
    });
  });

  it("returns critical when value exceeds criticalMax", () => {
    expect(evaluateReadingAgainstThreshold(46, temperatureThreshold)).toEqual({
      severity: "CRITICAL",
      direction: "ABOVE",
      thresholdValue: 45,
    });
  });

  it("returns critical when value falls below criticalMin", () => {
    expect(evaluateReadingAgainstThreshold(4, temperatureThreshold)).toEqual({
      severity: "CRITICAL",
      direction: "BELOW",
      thresholdValue: 5,
    });
  });

  it("returns null when monitoring is disabled", () => {
    expect(
      evaluateReadingAgainstThreshold(100, {
        ...temperatureThreshold,
        isActive: false,
      })
    ).toBeNull();
  });
});
