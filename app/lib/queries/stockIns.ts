import pool from "@/app/lib/dbConnection";

export async function getStockIns(limit = 50, userId: number) {
  const result = await pool.query(
    `SELECT si.*, p.name AS product_name FROM stock_ins si
     JOIN products p ON p.id = si.product_id AND p.user_id = $2
     WHERE si.user_id = $2
     ORDER BY si.created_at DESC LIMIT $1`,
    [limit, userId],
  );
  return result.rows;
}

export async function createStockIn(input: {
  product_id: number;
  qty: number;
  buy_price: number;
  note?: string | null;
  purchase_date?: string;
}, userId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const qty = Number(input.qty);
    if (!(qty > 0)) throw new Error("Qty must be > 0");
    const prod = await client.query(`SELECT id FROM products WHERE id = $1 AND user_id = $2`, [input.product_id, userId]);
    if (prod.rowCount === 0) throw new Error("Product not found");
    const r = await client.query(
      `INSERT INTO stock_ins (product_id, qty, buy_price, note, purchase_date, user_id)
       VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE),$6) RETURNING *`,
      [input.product_id, qty, input.buy_price, input.note ?? null, input.purchase_date ?? null, userId],
    );
    await client.query(
      `UPDATE products SET current_stock = current_stock + $1, buy_price = $2, updated_at = NOW() WHERE id = $3 AND user_id = $4`,
      [qty, input.buy_price, input.product_id, userId],
    );
    await client.query("COMMIT");
    return r.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
