// Edge-safe JWT session tokens (jose only — safe to import from proxy.ts).
import { SignJWT, jwtVerify } from "jose";

export const COOKIE_NAME = "st_auth";
// 7 days, in seconds
export const TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export interface SessionPayload {
  sub: string; // user id
  username: string;
  v: number; // token_version — bump to revoke all tokens
}

let cachedKey: Uint8Array | null = null;

function getSecretKey(): Uint8Array {
  if (cachedKey) return cachedKey;
  const secret = process.env.JWT_SECRET;
  // Fail fast: never sign/verify with a missing or weak secret.
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET must be set to a random string of at least 32 characters.",
    );
  }
  cachedKey = new TextEncoder().encode(secret);
  return cachedKey;
}

export async function signSessionToken(
  payload: SessionPayload,
): Promise<string> {
  return new SignJWT({ username: payload.username, v: payload.v })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuer("sheikh-trader")
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      issuer: "sheikh-trader",
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.username !== "string" ||
      typeof payload.v !== "number"
    ) {
      return null;
    }
    return { sub: payload.sub, username: payload.username, v: payload.v };
  } catch {
    return null;
  }
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: TOKEN_MAX_AGE,
  };
}
