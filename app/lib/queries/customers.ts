import pool from "@/app/lib/dbConnection";

export async function getCustomersWithDue() {
  const result = await pool.query(
    `SELECT c.*, COALESCE(SUM(s.due_amount),0) AS total_due, COUNT(s.id) FILTER (WHERE s.due_amount > 0) AS due_count
     FROM customers c
     LEFT JOIN sales s ON s.customer_id = c.id
     GROUP BY c.id ORDER BY total_due DESC`,
  );
  return result.rows;
}

export async function getCustomers() {
  const result = await pool.query(`SELECT * FROM customers ORDER BY created_at DESC LIMIT 200`);
  return result.rows;
}

export async function createCustomer(input: { name: string; phone?: string | null; address?: string | null }) {
  if (!input.name) throw new Error("Name required");
  const result = await pool.query(
    `INSERT INTO customers (name, phone, address) VALUES ($1,$2,$3) RETURNING *`,
    [input.name, input.phone ?? null, input.address ?? null],
  );
  return result.rows[0];
}
