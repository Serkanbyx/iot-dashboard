import { describe, expect, it } from "vitest";
import { updateThresholdRules } from "../src/validators/thresholdValidator.js";
import { runValidationRules } from "./helpers/runValidation.js";

describe("updateThresholdRules", () => {
  const validPayload = {
    minValue: 15,
    maxValue: 35,
    criticalMin: 5,
    criticalMax: 45,
    isActive: true,
  };

  it("accepts a valid threshold payload", async () => {
    const result = await runValidationRules(updateThresholdRules, validPayload);

    expect(result.isEmpty()).toBe(true);
  });

  it("rejects invalid threshold ordering", async () => {
    const result = await runValidationRules(updateThresholdRules, {
      ...validPayload,
      minValue: 40,
      maxValue: 30,
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0]?.msg).toContain("criticalMin < minValue");
  });

  it("rejects non-numeric threshold values", async () => {
    const result = await runValidationRules(updateThresholdRules, {
      ...validPayload,
      minValue: "hot",
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((error) => error.path === "minValue")).toBe(true);
  });

  it("rejects non-boolean isActive values", async () => {
    const result = await runValidationRules(updateThresholdRules, {
      ...validPayload,
      isActive: "yes",
    });

    expect(result.isEmpty()).toBe(false);
    expect(result.array().some((error) => error.path === "isActive")).toBe(true);
  });
});
