import pool from "@/app/lib/dbConnection";

export async function getCustomersWithDue(userId: number) {
  const result = await pool.query(
    `SELECT c.*, COALESCE(SUM(s.due_amount),0) AS total_due, COUNT(s.id) FILTER (WHERE s.due_amount > 0) AS due_count
     FROM customers c
     LEFT JOIN sales s ON s.customer_id = c.id AND s.user_id = $1
     WHERE c.user_id = $1
     GROUP BY c.id ORDER BY total_due DESC`,
    [userId],
  );
  return result.rows;
}

export async function getCustomers(userId: number) {
  const result = await pool.query(`SELECT * FROM customers WHERE user_id = $1 ORDER BY created_at DESC LIMIT 200`, [userId]);
  return result.rows;
}

export async function createCustomer(input: { name: string; phone?: string | null; address?: string | null }, userId: number) {
  if (!input.name) throw new Error("Name required");
  const result = await pool.query(
    `INSERT INTO customers (name, phone, address, user_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [input.name, input.phone ?? null, input.address ?? null, userId],
  );
  return result.rows[0];
}
