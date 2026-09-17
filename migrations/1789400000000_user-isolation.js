/**
 * Per-user shop isolation (shahabuddin = real shop, Demo123 = clean demo).
 * Adds user_id to all shop tables, backfills existing rows to shahabuddin,
 * makes accounts unique per user, and seeds default accounts for users
 * that have none (e.g. Demo123 starts empty/fresh).
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  const tables = [
    "products",
    "customers",
    "accounts",
    "sales",
    "stock_ins",
    "expenses",
    "due_collections",
  ];

  // 1. Add nullable user_id first (backfill before NOT NULL)
  for (const t of tables) {
    pgm.addColumns(t, {
      user_id: {
        type: "integer",
        references: "users(id)",
        onDelete: "CASCADE",
      },
    });
  }

  // 2. Backfill all existing rows to shahabuddin (fallback: oldest user)
  const owner = `COALESCE((SELECT id FROM users WHERE username = 'shahabuddin' LIMIT 1), (SELECT MIN(id) FROM users))`;
  for (const t of tables) {
    pgm.sql(`UPDATE ${t} SET user_id = (${owner}) WHERE user_id IS NULL`);
  }

  // 3. Enforce NOT NULL + index
  for (const t of tables) {
    pgm.alterColumn(t, "user_id", { notNull: true });
    pgm.createIndex(t, "user_id");
  }

  // 4. Accounts were globally unique by name — make them unique per user
  pgm.sql(`ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_name_key`);
  pgm.addConstraint("accounts", "accounts_user_name_unique", {
    unique: ["user_id", "name"],
  });

  // 5. Seed default accounts for any user that has none (Demo123 => fresh/empty shop)
  pgm.sql(`
    INSERT INTO accounts (name, type, user_id)
    SELECT v.name, v.type, u.id
    FROM users u
    CROSS JOIN (VALUES ('Cash','cash'), ('DBBL','bank'), ('BRAC','bank'), ('Bkash','mobile')) AS v(name, type)
    WHERE NOT EXISTS (SELECT 1 FROM accounts a WHERE a.user_id = u.id)
  `);
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropConstraint("accounts", "accounts_user_name_unique", { ifExists: true });
  // NOTE: down does not restore global uniqueness if per-user duplicates exist.
  pgm.sql(
    `DELETE FROM accounts a USING accounts b WHERE a.ctid < b.ctid AND a.name = b.name`
  );
  pgm.addConstraint("accounts", "accounts_name_key", { unique: "name" });

  const tables = [
    "due_collections",
    "expenses",
    "stock_ins",
    "sales",
    "accounts",
    "customers",
    "products",
  ];
  for (const t of tables) {
    pgm.dropIndex(t, "user_id", { ifExists: true });
    pgm.dropColumns(t, ["user_id"]);
  }
};
