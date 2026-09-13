import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/app/lib/dbConnection";
import { requireAuth } from "@/app/lib/auth/session";
import {
  COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
} from "@/app/lib/auth/token";

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const current =
    typeof (body as { current_password?: unknown }).current_password === "string"
      ? (body as { current_password: string }).current_password
      : "";
  const next =
    typeof (body as { new_password?: unknown }).new_password === "string"
      ? (body as { new_password: string }).new_password
      : "";
  if (!current || !next || next.length < 8 || next.length > 72) {
    return NextResponse.json(
      { error: "New password must be 8-72 characters" },
      { status: 400 },
    );
  }

  try {
    const r = await pool.query(
      `SELECT id, username, password_hash, token_version FROM users WHERE id = $1`,
      [auth.user.id],
    );
    const row = r.rows[0];
    if (!row) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const ok = await bcrypt.compare(current, row.password_hash);
    if (!ok) {
      return NextResponse.json(
        { error: "Current password is wrong" },
        { status: 400 },
      );
    }
    const same = await bcrypt.compare(next, row.password_hash);
    if (same) {
      return NextResponse.json(
        { error: "New password must be different" },
        { status: 400 },
      );
    }

    const hash = await bcrypt.hash(next, 12);
    const newVersion = Number(row.token_version) + 1;
    await pool.query(
      `UPDATE users SET password_hash = $1, token_version = $2 WHERE id = $3`,
      [hash, newVersion, row.id],
    );

    // Fresh token for this device (new version); every other device is logged out.
    const token = await signSessionToken({
      sub: String(row.id),
      username: row.username,
      v: newVersion,
    });
    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Password change failed" },
      { status: 500 },
    );
  }
}
