import { NextRequest, NextResponse } from "next/server";
import pool from "@/app/lib/dbConnection";
import {
  COOKIE_NAME,
  sessionCookieOptions,
  signSessionToken,
} from "@/app/lib/auth/token";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const otp = typeof b.otp === "string" ? b.otp.trim() : "";

  if (!email || !otp || otp.length !== 6) {
    return NextResponse.json({ error: "Email and 6-digit OTP are required" }, { status: 400 });
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Find valid pending registration
    const pending = await client.query(
      `SELECT id, email, name, username, password_hash
       FROM pending_registrations
       WHERE email = $1 AND otp_code = $2 AND expires_at > NOW()
       LIMIT 1`,
      [email, otp],
    );

    if (!pending.rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Invalid or expired OTP" },
        { status: 401 },
      );
    }

    const row = pending.rows[0];

    // Check again that username/email isn't taken (race condition guard)
    const clash = await client.query(
      `SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
      [row.username, row.email],
    );
    if (clash.rowCount && clash.rowCount > 0) {
      await client.query("ROLLBACK");
      return NextResponse.json(
        { error: "Username or email already registered" },
        { status: 409 },
      );
    }

    // Create the verified user
    const inserted = await client.query(
      `INSERT INTO users (username, password_hash, email, name)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, token_version`,
      [row.username, row.password_hash, row.email, row.name],
    );
    const user = inserted.rows[0];

    // Each login = separate shop: seed default accounts for the new user
    await client.query(
      `INSERT INTO accounts (name, type, user_id)
       VALUES ('Cash','cash',$1), ('DBBL','bank',$1), ('BRAC','bank',$1), ('Bkash','mobile',$1)
       ON CONFLICT DO NOTHING`,
      [user.id],
    );

    // Clean up all pending registrations for this email
    await client.query(`DELETE FROM pending_registrations WHERE email = $1`, [email]);

    await client.query("COMMIT");

    // Auto-login: issue JWT session
    const token = await signSessionToken({
      sub: String(user.id),
      username: user.username,
      v: Number(user.token_version),
    });
    const res = NextResponse.json({
      ok: true,
      username: user.username,
      message: "Account verified successfully",
    });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions());
    return res;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {});
    console.error(e);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
