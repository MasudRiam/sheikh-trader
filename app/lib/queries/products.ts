import pool from "@/app/lib/dbConnection";
import { Product, CreateProductInput } from "@/types/products";

export async function getAllProducts(userId: number): Promise<Product[]> {
  const result = await pool.query(
    "SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC, id DESC",
    [userId],
  );
  return result.rows;
}

export async function getProducts({ limit = 10, offset = 0, userId }: { limit?: number; offset?: number; userId: number }) {
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 100);
  const safeOffset = Math.max(Math.floor(offset) || 0, 0);
  const [rows, count] = await Promise.all([
    pool.query("SELECT * FROM products WHERE user_id = $1 ORDER BY created_at DESC, id DESC LIMIT $2 OFFSET $3", [userId, safeLimit, safeOffset]),
    pool.query("SELECT COUNT(*)::int AS total FROM products WHERE user_id = $1", [userId]),
  ]);
  return { rows: rows.rows as Product[], total: count.rows[0].total as number };
}

export async function getProductById(id: number, userId: number): Promise<Product | null> {
  const result = await pool.query("SELECT * FROM products WHERE id = $1 AND user_id = $2", [id, userId]);
  return result.rows[0] || null;
}

export async function createProduct(
  data: CreateProductInput,
  userId: number,
): Promise<Product> {
  const {
    name,
    category,
    unit = "pcs",
    current_stock = 0,
    buy_price,
    sell_price,
  } = data;
  const result = await pool.query(
    `INSERT INTO products (name, category, unit, current_stock, buy_price, sell_price, user_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [name, category, unit, current_stock, buy_price, sell_price, userId],
  );
  return result.rows[0];
}

export async function updateProduct(
  id: number,
  data: Partial<CreateProductInput>,
  userId: number,
): Promise<Product | null> {
  const fields = Object.keys(data);
  if (fields.length === 0) return getProductById(id, userId);

  const setClause = fields.map((field, i) => `${field} = $${i + 3}`).join(", ");
  const values = fields.map((field) => (data as any)[field]);

  const result = await pool.query(
    `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 AND user_id = $2 RETURNING *`,
    [id, userId, ...values],
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: number, userId: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM products WHERE id = $1 AND user_id = $2", [id, userId]);
  return (result.rowCount ?? 0) > 0;
}
