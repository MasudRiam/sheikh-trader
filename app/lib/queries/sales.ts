import pool from "@/app/lib/dbConnection";

export interface SaleItemInput {
  product_id: number;
  qty: number;
  sell_price: number;
}

export interface CreateSaleInput {
  items: SaleItemInput[];
  customer_id?: number | null;
  customer_name?: string | null;
  customer_phone?: string | null;
  paid_amount: number;
  account_id?: number | null;
  sale_date?: string;
  note?: string | null;
}

export async function getSales(limit = 50) {
  const result = await pool.query(
    `SELECT s.*, c.name AS customer_name, a.name AS account_name
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     LEFT JOIN accounts a ON a.id = s.account_id
     ORDER BY s.created_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows;
}

export async function getDueSales() {
  const result = await pool.query(
    `SELECT s.*, c.name AS customer_name, c.phone AS customer_phone
     FROM sales s
     LEFT JOIN customers c ON c.id = s.customer_id
     WHERE s.due_amount > 0
     ORDER BY s.created_at DESC LIMIT 100`,
  );
  return result.rows;
}

export async function createSale(input: CreateSaleInput) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { items, paid_amount, account_id, note, sale_date } = input;
    if (!items || items.length === 0) throw new Error("No items");

    let customerId = input.customer_id ?? null;
    if (!customerId && input.customer_name) {
      const c = await client.query(
        `INSERT INTO customers (name, phone) VALUES ($1, $2) RETURNING id`,
        [input.customer_name, input.customer_phone ?? null],
      );
      customerId = c.rows[0].id;
    }

    let total = 0;
    let profit = 0;
    const lines: { product_id: number; qty: number; buy: number; sell: number }[] = [];
    for (const it of items) {
      const p = await client.query(
        `SELECT buy_price, current_stock FROM products WHERE id = $1`,
        [it.product_id],
      );
      if (p.rowCount === 0) throw new Error(`Product ${it.product_id} not found`);
      const buy = Number(p.rows[0].buy_price);
      const stock = Number(p.rows[0].current_stock);
      if (stock < it.qty) throw new Error(`Stock short for product ${it.product_id}`);
      total += it.qty * Number(it.sell_price);
      profit += it.qty * (Number(it.sell_price) - buy);
      lines.push({ product_id: it.product_id, qty: it.qty, buy, sell: Number(it.sell_price) });
    }

    const paid = Number(paid_amount);
    if (paid < 0 || paid > total) throw new Error("Paid amount invalid");
    const due = total - paid;

    const s = await client.query(
      `INSERT INTO sales (sale_date, customer_id, total_amount, paid_amount, due_amount, profit, account_id, note)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [sale_date ?? null, customerId, total, paid, due, profit, account_id ?? null, note ?? null],
    );
    const sale = s.rows[0];

    for (const l of lines) {
      await client.query(
        `INSERT INTO sale_items (sale_id, product_id, qty, buy_price, sell_price)
         VALUES ($1,$2,$3,$4,$5)`,
        [sale.id, l.product_id, l.qty, l.buy, l.sell],
      );
      await client.query(
        `UPDATE products SET current_stock = current_stock - $1, updated_at = NOW() WHERE id = $2`,
        [l.qty, l.product_id],
      );
    }

    if (account_id && paid > 0) {
      await client.query(`UPDATE accounts SET balance = balance + $1 WHERE id = $2`, [paid, account_id]);
    }

    await client.query("COMMIT");
    return sale;
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export async function collectDue(input: {
  sale_id?: number | null;
  customer_id?: number | null;
  amount: number;
  account_id?: number | null;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const amount = Number(input.amount);
    if (!(amount > 0)) throw new Error("Amount must be > 0");

    let saleId = input.sale_id ?? null;
    let customerId = input.customer_id ?? null;

    if (saleId) {
      const s = await client.query(`SELECT * FROM sales WHERE id = $1`, [saleId]);
      if (s.rowCount === 0) throw new Error("Sale not found");
      const row = s.rows[0];
      const due = Number(row.due_amount);
      if (amount > due) throw new Error("Amount exceeds due");
      customerId = customerId ?? row.customer_id;
      await client.query(
        `UPDATE sales SET paid_amount = paid_amount + $1, due_amount = due_amount - $1 WHERE id = $2`,
        [amount, saleId],
      );
    } else if (customerId) {
      // collect against oldest dues
      const dues = await client.query(
        `SELECT id, due_amount FROM sales WHERE customer_id = $1 AND due_amount > 0 ORDER BY created_at ASC`,
        [customerId],
      );
      let remaining = amount;
      const totalDue = dues.rows.reduce((a: number, r: { due_amount: string }) => a + Number(r.due_amount), 0);
      if (amount > totalDue) throw new Error("Amount exceeds total due");
      for (const d of dues.rows) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, Number(d.due_amount));
        await client.query(
          `UPDATE sales SET paid_amount = paid_amount + $1, due_amount = due_amount - $1 WHERE id = $2`,
          [take, d.id],
        );
        remaining -= take;
      }
      saleId = dues.rows[0]?.id ?? null;
    } else {
      throw new Error("sale_id or customer_id required");
    }

    await client.query(
      `INSERT INTO due_collections (customer_id, sale_id, amount, account_id) VALUES ($1,$2,$3,$4)`,
      [customerId, saleId, amount, input.account_id ?? null],
    );
    if (input.account_id) {
      await client.query(`UPDATE accounts SET balance = balance + $1 WHERE id = $2`, [amount, input.account_id]);
    }
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
