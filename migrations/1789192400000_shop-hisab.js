/**
 * @type {import('node-pg-migrate').ColumnDefinitions | undefined}
 */
export const shorthands = undefined;

/**
 * Shop hisab schema — mirrors the handwritten khata:
 * Mot Bikri = Cash + Baki, Net = Mot - Khoroch,
 * Accounts = Cash / DBBL / BRAC / Bkash
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const up = (pgm) => {
  // Allow AC parts categories (old check only allowed AC/TV)
  pgm.dropConstraint("products", "products_category_check", { ifExists: true });
  pgm.addConstraint("products", "products_category_check", {
    check: "category IN ('AC','AC_PARTS','TV','OTHER')",
  });

  pgm.createTable("customers", {
    id: "id",
    name: { type: "varchar(255)", notNull: true },
    phone: { type: "varchar(30)" },
    address: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });

  pgm.createTable("accounts", {
    id: "id",
    name: { type: "varchar(50)", notNull: true, unique: true },
    type: {
      type: "varchar(20)",
      notNull: true,
      default: "cash",
      check: "type IN ('cash','bank','mobile')",
    },
    balance: { type: "numeric(12,2)", notNull: true, default: 0 },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });

  // Seed the 4 accounts seen in the khata
  pgm.sql(
    "INSERT INTO accounts (name, type) VALUES ('Cash','cash'), ('DBBL','bank'), ('BRAC','bank'), ('Bkash','mobile') ON CONFLICT (name) DO NOTHING",
  );

  pgm.createTable("sales", {
    id: "id",
    sale_date: { type: "date", notNull: true, default: pgm.func("CURRENT_DATE") },
    customer_id: {
      type: "integer",
      references: "customers(id)",
      onDelete: "SET NULL",
    },
    total_amount: { type: "numeric(12,2)", notNull: true, default: 0 },
    paid_amount: { type: "numeric(12,2)", notNull: true, default: 0 },
    due_amount: { type: "numeric(12,2)", notNull: true, default: 0 },
    profit: { type: "numeric(12,2)", notNull: true, default: 0 },
    account_id: { type: "integer", references: "accounts(id)" },
    note: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });
  pgm.createIndex("sales", "sale_date");
  pgm.createIndex("sales", "customer_id");

  pgm.createTable("sale_items", {
    id: "id",
    sale_id: {
      type: "integer",
      notNull: true,
      references: "sales(id)",
      onDelete: "CASCADE",
    },
    product_id: {
      type: "integer",
      notNull: true,
      references: "products(id)",
    },
    qty: { type: "integer", notNull: true, default: 1 },
    buy_price: { type: "numeric(10,2)", notNull: true, default: 0 },
    sell_price: { type: "numeric(10,2)", notNull: true, default: 0 },
  });
  pgm.createIndex("sale_items", "sale_id");

  pgm.createTable("stock_ins", {
    id: "id",
    product_id: {
      type: "integer",
      notNull: true,
      references: "products(id)",
    },
    qty: { type: "integer", notNull: true },
    buy_price: { type: "numeric(10,2)", notNull: true, default: 0 },
    purchase_date: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    note: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });

  pgm.createTable("expenses", {
    id: "id",
    expense_date: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    category: { type: "varchar(100)", notNull: true, default: "general" },
    amount: { type: "numeric(12,2)", notNull: true },
    account_id: { type: "integer", references: "accounts(id)" },
    note: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });
  pgm.createIndex("expenses", "expense_date");

  pgm.createTable("due_collections", {
    id: "id",
    customer_id: {
      type: "integer",
      references: "customers(id)",
      onDelete: "SET NULL",
    },
    sale_id: { type: "integer", references: "sales(id)", onDelete: "SET NULL" },
    amount: { type: "numeric(12,2)", notNull: true },
    account_id: { type: "integer", references: "accounts(id)" },
    collection_date: {
      type: "date",
      notNull: true,
      default: pgm.func("CURRENT_DATE"),
    },
    created_at: { type: "timestamp", default: pgm.func("now()") },
  });
};

/**
 * @param pgm {import('node-pg-migrate').MigrationBuilder}
 */
export const down = (pgm) => {
  pgm.dropTable("due_collections");
  pgm.dropTable("expenses");
  pgm.dropTable("stock_ins");
  pgm.dropTable("sale_items");
  pgm.dropTable("sales");
  pgm.dropTable("accounts");
  pgm.dropTable("customers");
  pgm.dropConstraint("products", "products_category_check", { ifExists: true });
  pgm.addConstraint("products", "products_category_check", {
    check: "category IN ('AC', 'TV')",
  });
};
