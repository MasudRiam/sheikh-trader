import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import pool from "@/app/lib/dbConnection";

function generateOTP(): string {
  // 6-digit numeric OTP
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const username = typeof b.username === "string" ? b.username.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  // ---- Validation ----
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (!name || name.length > 255) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  if (!username || username.length > 100 || !/^[A-Za-z0-9_.-]+$/.test(username)) {
    return NextResponse.json(
      { error: "Username: 1-100 chars, letters/numbers/._- only" },
      { status: 400 },
    );
  }
  if (password.length < 8 || password.length > 72) {
    return NextResponse.json(
      { error: "Password must be 8-72 characters" },
      { status: 400 },
    );
  }

  try {
    // Check if username or email already taken (in users table)
    const existing = await pool.query(
      `SELECT id FROM users WHERE username = $1 OR email = $2 LIMIT 1`,
      [username, email],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      return NextResponse.json(
        { error: "Username or email already registered" },
        { status: 409 },
      );
    }

    // Delete any expired or previous pending registrations for this email
    await pool.query(
      `DELETE FROM pending_registrations WHERE email = $1 OR expires_at < NOW()`,
      [email],
    );

    const passwordHash = await bcrypt.hash(password, 12);
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      `INSERT INTO pending_registrations (email, name, username, password_hash, otp_code, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, name, username, passwordHash, otpCode, expiresAt],
    );

    // For now, OTP is stored in DB only (no email sending).
    // In production, send via email/SMS here.
    console.log(`[OTP] Registration OTP for ${email}: ${otpCode}`);

    return NextResponse.json({
      ok: true,
      email,
      message: "OTP has been generated. Check the database or server logs.",
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
