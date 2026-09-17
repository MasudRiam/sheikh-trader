import pool from "@/app/lib/dbConnection";

export async function getAccounts(userId: number) {
  const result = await pool.query(`SELECT * FROM accounts WHERE user_id = $1 ORDER BY id ASC`, [userId]);
  return result.rows;
}
