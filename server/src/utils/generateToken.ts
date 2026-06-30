import jwt, { type SignOptions } from "jsonwebtoken";
import config from "../config/env.js";

interface AccessTokenPayload {
  userId: string;
}

const accessTokenOptions: SignOptions = {
  expiresIn: config.JWT_ACCESS_EXPIRES_IN as SignOptions["expiresIn"],
};

export function generateAccessToken(userId: string): string {
  return jwt.sign({ userId }, config.JWT_SECRET, accessTokenOptions);
}

/** @deprecated Use generateAccessToken — kept for backward compatibility in tests */
export function generateToken(userId: string): string {
  return generateAccessToken(userId);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, config.JWT_SECRET) as AccessTokenPayload;
}
