import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/app/lib/dbConnection";
import {
  COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
} from "@/app/lib/auth/token";
import {
  clientKey,
  loginBlocked,
  recordLoginFail,
  resetLoginAttempts,
} from "@/app/lib/auth/session";

// Runs when the user does not exist so that unknown vs wrong password
// take the same time (no username enumeration via timing).
const DUMMY_HASH =
  "$2b$12$MOOQxvRFGy1y6gxK5SEMueit380yogmcIFMJY7xwNhM6MlyyWiCKW";

export async function POST(req: NextRequest) {
  const key = clientKey(req);
  const retryAfter = loginBlocked(key);
  if (retryAfter > 0) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const username =
    typeof (body as { username?: unknown }).username === "string"
      ? (body as { username: string }).username.trim()
      : "";
  const password =
    typeof (body as { password?: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!username || username.length > 100 || !password || password.length > 72) {
    recordLoginFail(key);
    return NextResponse.json(
      { error: "Invalid username or password" },
      { status: 401 },
    );
  }

  try {
    const r = await pool.query(
      `SELECT id, username, password_hash, token_version FROM users WHERE username = $1`,
      [username],
    );
    const row = r.rows[0];
    // Always run a compare: dummy hash when the user is missing.
    const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
    if (!row || !ok) {
      recordLoginFail(key);
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    resetLoginAttempts(key);
    const token = await signSessionToken({
      sub: String(row.id),
      username: row.username,
      v: Number(row.token_version),
    });
    const res = NextResponse.json({ ok: true, username: row.username });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
