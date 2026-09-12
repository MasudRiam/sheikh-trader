/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const up = (pgm) => {
  pgm.createTable("products", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    category: {
      type: "varchar(10)",
      notNull: true,
      check: "category IN ('AC', 'TV')",
    },
    unit: { type: "varchar(20)", default: "pcs" },
    current_stock: { type: "integer", notNull: true, default: 0 },
    buy_price: { type: "numeric(10,2)", notNull: true, default: 0 },
    sell_price: { type: "numeric(10,2)", notNull: true, default: 0 },
    created_at: { type: "timestamp", default: pgm.func("now()") },
    updated_at: { type: "timestamp", default: pgm.func("now()") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 * @param run {() => void | undefined}
 * @returns {Promise<void> | void}
 */
export const down = (pgm) => {
  pgm.dropTable("products");
};
