import type { Request } from "express";
import { validationResult, type ValidationChain } from "express-validator";

export async function runValidationRules(
  rules: ValidationChain[],
  body: Record<string, unknown>
) {
  const req = { body } as Request;

  await Promise.all(rules.map((rule) => rule.run(req)));

  return validationResult(req);
}
