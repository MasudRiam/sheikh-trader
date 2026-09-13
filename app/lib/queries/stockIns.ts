import pool from "@/app/lib/dbConnection";

export async function getStockIns(limit = 50) {
  const result = await pool.query(
    `SELECT si.*, p.name AS product_name FROM stock_ins si
     JOIN products p ON p.id = si.product_id
     ORDER BY si.created_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function createStockIn(input: {
  product_id: number;
  qty: number;
  buy_price: number;
  note?: string | null;
  purchase_date?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const qty = Number(input.qty);
    if (!(qty > 0)) throw new Error("Qty must be > 0");
    const r = await client.query(
      `INSERT INTO stock_ins (product_id, qty, buy_price, note, purchase_date)
       VALUES ($1,$2,$3,$4,COALESCE($5, CURRENT_DATE)) RETURNING *`,
      [input.product_id, qty, input.buy_price, input.note ?? null, input.purchase_date ?? null],
    );
    await client.query(
      `UPDATE products SET current_stock = current_stock + $1, buy_price = $2, updated_at = NOW() WHERE id = $3`,
      [qty, input.buy_price, input.product_id],
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
