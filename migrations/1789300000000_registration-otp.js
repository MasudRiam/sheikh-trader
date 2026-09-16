/**
 * Registration with OTP verification.
 * pending_registrations holds unverified signups with a 6-digit OTP.
 * Adds email + name columns to the users table.
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // Extend users with email and display name
  pgm.addColumns("users", {
    email: { type: "varchar(255)", unique: true },
    name: { type: "varchar(255)" },
  });

  // Pending registrations — OTP verified before moving to users
  pgm.createTable("pending_registrations", {
    id: "id",
    email: { type: "varchar(255)", notNull: true },
    name: { type: "varchar(255)", notNull: true },
    username: { type: "varchar(100)", notNull: true },
    password_hash: { type: "varchar(255)", notNull: true },
    otp_code: { type: "varchar(6)", notNull: true },
    expires_at: { type: "timestamptz", notNull: true },
    created_at: { type: "timestamptz", default: pgm.func("now()") },
  });

  pgm.createIndex("pending_registrations", "email");
  pgm.createIndex("pending_registrations", "otp_code");
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable("pending_registrations");
  pgm.dropColumns("users", ["email", "name"]);
};
