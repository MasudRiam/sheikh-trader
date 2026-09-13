import pool from "@/app/lib/dbConnection";

export async function getAccounts() {
  const result = await pool.query(`SELECT * FROM accounts ORDER BY id ASC`);
  return result.rows;
}
