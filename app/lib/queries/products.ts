import pool from "@/app/lib/dbConnection";
import { Product, CreateProductInput } from "@/types/products";

export async function getAllProducts(): Promise<Product[]> {
  const result = await pool.query(
    "SELECT * FROM products ORDER BY created_at DESC",
  );
  return result.rows;
}

export async function getProductById(id: number): Promise<Product | null> {
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  return result.rows[0] || null;
}

export async function createProduct(
  data: CreateProductInput,
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
    `INSERT INTO products (name, category, unit, current_stock, buy_price, sell_price)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, category, unit, current_stock, buy_price, sell_price],
  );
  return result.rows[0];
}

export async function updateProduct(
  id: number,
  data: Partial<CreateProductInput>,
): Promise<Product | null> {
  const fields = Object.keys(data);
  if (fields.length === 0) return getProductById(id);

  const setClause = fields.map((field, i) => `${field} = $${i + 2}`).join(", ");
  const values = fields.map((field) => (data as any)[field]);

  const result = await pool.query(
    `UPDATE products SET ${setClause}, updated_at = NOW() WHERE id = $1 RETURNING *`,
    [id, ...values],
  );
  return result.rows[0] || null;
}

export async function deleteProduct(id: number): Promise<boolean> {
  const result = await pool.query("DELETE FROM products WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
