// Node-only auth helpers for API routes (imports pg — never import from proxy.ts).
import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/dbConnection";
import {
  COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@/app/lib/auth/token";

export interface AuthUser {
  id: number;
  username: string;
}

/**
 * Verify the session cookie AND the DB record (user exists + token version
 * matches). Version mismatch means tokens were revoked — force re-login.
 */
export async function getSessionUser(
  req: NextRequest,
): Promise<(AuthUser & { token: SessionPayload }) | null> {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  if (!payload) return null;
  const id = Number(payload.sub);
  if (!Number.isInteger(id) || id <= 0) return null;
  const r = await pool.query(
    `SELECT id, username, token_version FROM users WHERE id = $1`,
    [id],
  );
  const row = r.rows[0];
  if (!row || Number(row.token_version) !== payload.v) return null;
  return { id: row.id, username: row.username, token: payload };
}

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

/**
 * Guard for protected API routes. Returns the user, or a 401/403 response
 * to return directly. For state-changing methods it also enforces a
 * same-origin check (Origin/Referer must match the request host) as
 * defense-in-depth against CSRF on top of SameSite=Lax cookies.
 */
export async function requireAuth(
  req: NextRequest,
): Promise<{ user: AuthUser } | { response: NextResponse }> {
  const session = await getSessionUser(req).catch(() => null);
  if (!session) return { response: unauthorized() };

  if (req.method !== "GET" && req.method !== "HEAD" && req.method !== "OPTIONS") {
    const host = req.headers.get("host") ?? req.nextUrl.host;
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");
    const sameOrigin = (url: string) => {
      try {
        return new URL(url).host === host;
      } catch {
        return false;
      }
    };
    if (
      !((origin && sameOrigin(origin)) || (!origin && referer && sameOrigin(referer)))
    ) {
      return {
        response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      };
    }
  }
  return { user: { id: session.id, username: session.username } };
}

// ---- login brute-force protection (in-memory, per instance) ----
const MAX_FAILS = 5;
const WINDOW_MS = 10 * 60 * 1000;
const fails = new Map<string, { count: number; resetAt: number }>();

export function loginBlocked(key: string): number {
  const now = Date.now();
  const e = fails.get(key);
  if (!e) return 0;
  if (now >= e.resetAt) {
    fails.delete(key);
    return 0;
  }
  if (e.count < MAX_FAILS) return 0;
  return Math.ceil((e.resetAt - now) / 1000);
}

export function recordLoginFail(key: string) {
  const now = Date.now();
  const e = fails.get(key);
  if (!e || now >= e.resetAt) {
    fails.set(key, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    e.count += 1;
  }
}

export function resetLoginAttempts(key: string) {
  fails.delete(key);
}

export function clientKey(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim() || "unknown";
  return `login:${ip}`;
}
