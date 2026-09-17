import pool from "@/app/lib/dbConnection";

export async function getExpenses(limit = 50, userId: number) {
  const result = await pool.query(
    `SELECT e.*, a.name AS account_name FROM expenses e
     LEFT JOIN accounts a ON a.id = e.account_id AND a.user_id = $2
     WHERE e.user_id = $2
     ORDER BY e.expense_date DESC, e.created_at DESC, e.id DESC LIMIT $1`,
    [limit, userId],
  );
  return result.rows;
}

export async function getExpensesPaginated({ limit = 10, offset = 0, userId }: { limit?: number; offset?: number; userId: number }) {
  const safeLimit = Math.min(Math.max(Math.floor(limit) || 10, 1), 100);
  const safeOffset = Math.max(Math.floor(offset) || 0, 0);
  const [rows, count] = await Promise.all([
    pool.query(
      `SELECT e.*, a.name AS account_name FROM expenses e
       LEFT JOIN accounts a ON a.id = e.account_id AND a.user_id = $3
       WHERE e.user_id = $3
       ORDER BY e.expense_date DESC, e.created_at DESC, e.id DESC LIMIT $1 OFFSET $2`,
      [safeLimit, safeOffset, userId],
    ),
    pool.query(`SELECT COUNT(*)::int AS total FROM expenses WHERE user_id = $1`, [userId]),
  ]);
  return { rows: rows.rows, total: count.rows[0].total as number };
}

export async function createExpense(input: {
  category: string;
  amount: number;
  account_id?: number | null;
  note?: string | null;
  expense_date?: string;
}, userId: number) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const amount = Number(input.amount);
    if (!(amount > 0)) throw new Error("Amount must be > 0");
    if (input.account_id) {
      const acc = await client.query(`SELECT id FROM accounts WHERE id = $1 AND user_id = $2`, [input.account_id, userId]);
      if (acc.rowCount === 0) throw new Error("Account not found");
    }
    const r = await client.query(
      `INSERT INTO expenses (expense_date, category, amount, account_id, note, user_id)
       VALUES (COALESCE($1, CURRENT_DATE), $2, $3, $4, $5, $6) RETURNING *`,
      [input.expense_date ?? null, input.category || "general", amount, input.account_id ?? null, input.note ?? null, userId],
    );
    if (input.account_id) {
      await client.query(`UPDATE accounts SET balance = balance - $1 WHERE id = $2 AND user_id = $3`, [amount, input.account_id, userId]);
    }
    await client.query("COMMIT");
    return r.rows[0];
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}
