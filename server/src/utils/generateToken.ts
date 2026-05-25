import jwt from "jsonwebtoken";
import config from "../config/env.js";

export function generateToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}
