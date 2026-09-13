/**
 * Login users for JWT auth.
 * password_hash = bcrypt hash (cost 12). Never store plain passwords.
 * token_version is bumped to invalidate all existing tokens (e.g. password change).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  pgm.createTable("users", {
    id: "id",
    username: { type: "varchar(100)", notNull: true, unique: true },
    password_hash: { type: "varchar(255)", notNull: true },
    token_version: { type: "integer", notNull: true, default: 0 },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });
  pgm.createIndex("users", "username", { unique: true });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable("users");
};
