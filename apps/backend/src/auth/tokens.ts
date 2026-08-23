import { SignJWT, jwtVerify } from "jose";
import { randomBytes } from "node:crypto";
import { env } from "../env.js";

const secret = new TextEncoder().encode(env.JWT_SECRET);

export interface AccessTokenPayload {
  teamId: number;
  memberId: number;
  displayName: string;
  isOwner: boolean;
  isAdmin: boolean;
}

export async function signAccessToken(payload: AccessTokenPayload) {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${env.ACCESS_TOKEN_TTL_DAYS}d`)
    .sign(secret);
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as AccessTokenPayload;
}

export function generateInviteCode() {
  return randomBytes(6).toString("base64url").toUpperCase();
}
