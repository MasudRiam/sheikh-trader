import pool from "@/app/lib/dbConnection";

export async function getDailySummary(date?: string) {
  const d = date ?? new Date().toISOString().slice(0, 10);
  const sales = await pool.query(
    `SELECT COALESCE(SUM(total_amount),0) AS total,
            COALESCE(SUM(paid_amount),0) AS cash,
            COALESCE(SUM(due_amount),0) AS due,
            COALESCE(SUM(profit),0) AS profit
     FROM sales WHERE sale_date = $1`,
    [d],
  );
  const exp = await pool.query(
    `SELECT COALESCE(SUM(amount),0) AS khoroch FROM expenses WHERE expense_date = $1`,
    [d],
  );
  const s = sales.rows[0];
  return {
    date: d,
    totalSell: Number(s.total),
    cashReceived: Number(s.cash),
    dueAmount: Number(s.due),
    profit: Number(s.profit),
    khoroch: Number(exp.rows[0].khoroch),
  };
}

export interface RangeRow {
  date: string;
  totalSell: number;
  cashReceived: number;
  dueAmount: number;
  profit: number;
  khoroch: number;
  net: number;
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export async function getRangeSummary(from?: string, to?: string) {
  const end = to ?? toISODate(new Date());
  const startDate = new Date(from ?? new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10));
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) throw new Error("Invalid date");
  if (startDate > endDate) throw new Error("from must be <= to");
  const days = Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1;
  if (days > 366) throw new Error("Max 366 days");

  const fromISO = toISODate(startDate);
  const toISO = toISODate(endDate);

  const result = await pool.query(
    `WITH days AS (
       SELECT generate_series($1::date, $2::date, '1 day')::date AS d
     ),
     s AS (
       SELECT sale_date AS d, SUM(total_amount) AS total, SUM(paid_amount) AS cash,
              SUM(due_amount) AS due, SUM(profit) AS profit
       FROM sales WHERE sale_date BETWEEN $1 AND $2 GROUP BY sale_date
     ),
     e AS (
       SELECT expense_date AS d, SUM(amount) AS khoroch
       FROM expenses WHERE expense_date BETWEEN $1 AND $2 GROUP BY expense_date
     )
     SELECT days.d AS date,
            COALESCE(s.total,0) AS total, COALESCE(s.cash,0) AS cash,
            COALESCE(s.due,0) AS due, COALESCE(s.profit,0) AS profit,
            COALESCE(e.khoroch,0) AS khoroch
     FROM days LEFT JOIN s ON s.d = days.d LEFT JOIN e ON e.d = days.d
     ORDER BY days.d ASC`,
    [fromISO, toISO],
  );

  const rows: RangeRow[] = result.rows.map((r: { date: Date | string; total: string; cash: string; due: string; profit: string; khoroch: string }) => {
    const total = Number(r.total);
    const khoroch = Number(r.khoroch);
    return {
      date: r.date instanceof Date ? toISODate(r.date) : String(r.date).slice(0, 10),
      totalSell: total,
      cashReceived: Number(r.cash),
      dueAmount: Number(r.due),
      profit: Number(r.profit),
      khoroch,
      net: total - khoroch,
    };
  });

  const totals = rows.reduce(
    (a, r) => ({
      totalSell: a.totalSell + r.totalSell,
      cashReceived: a.cashReceived + r.cashReceived,
      dueAmount: a.dueAmount + r.dueAmount,
      profit: a.profit + r.profit,
      khoroch: a.khoroch + r.khoroch,
      net: a.net + r.net,
    }),
    { totalSell: 0, cashReceived: 0, dueAmount: 0, profit: 0, khoroch: 0, net: 0 },
  );

  return { from: fromISO, to: toISO, totals, rows };
}

export async function getMonthlySummary(year: number, month: number) {
  if (!(month >= 1 && month <= 12)) throw new Error("month 1-12");
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return getRangeSummary(from, to);
}

export async function getYearlySummary(year: number) {
  if (!(year >= 2000 && year <= 2100)) throw new Error("Invalid year");
  const result = await pool.query(
    `WITH months AS (
       SELECT generate_series(1, 12) AS m
     ),
     s AS (
       SELECT EXTRACT(MONTH FROM sale_date)::int AS m,
              SUM(total_amount) AS total, SUM(paid_amount) AS cash,
              SUM(due_amount) AS due, SUM(profit) AS profit
       FROM sales WHERE EXTRACT(YEAR FROM sale_date)::int = $1 GROUP BY 1
     ),
     e AS (
       SELECT EXTRACT(MONTH FROM expense_date)::int AS m, SUM(amount) AS khoroch
       FROM expenses WHERE EXTRACT(YEAR FROM expense_date)::int = $1 GROUP BY 1
     )
     SELECT months.m AS month, COALESCE(s.total,0) AS total,
            COALESCE(s.cash,0) AS cash, COALESCE(s.due,0) AS due,
            COALESCE(s.profit,0) AS profit, COALESCE(e.khoroch,0) AS khoroch
     FROM months LEFT JOIN s ON s.m = months.m LEFT JOIN e ON e.m = months.m
     ORDER BY months.m ASC`,
    [year],
  );
  const rows = result.rows.map((r: { month: number; total: string; cash: string; due: string; profit: string; khoroch: string }) => {
    const total = Number(r.total);
    const khoroch = Number(r.khoroch);
    return {
      month: Number(r.month),
      totalSell: total,
      cashReceived: Number(r.cash),
      dueAmount: Number(r.due),
      profit: Number(r.profit),
      khoroch,
      net: total - khoroch,
    };
  });
  const totals = rows.reduce(
    (a, r) => ({
      totalSell: a.totalSell + r.totalSell,
      cashReceived: a.cashReceived + r.cashReceived,
      dueAmount: a.dueAmount + r.dueAmount,
      profit: a.profit + r.profit,
      khoroch: a.khoroch + r.khoroch,
      net: a.net + r.net,
    }),
    { totalSell: 0, cashReceived: 0, dueAmount: 0, profit: 0, khoroch: 0, net: 0 },
  );
  return { year, totals, rows };
}
