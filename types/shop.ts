export interface Product {
  id: number;
  name: string;
  category: "AC" | "AC_PARTS" | "TV" | "OTHER";
  unit: string;
  current_stock: number;
  buy_price: number;
  sell_price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  category: "AC" | "AC_PARTS" | "TV" | "OTHER";
  unit?: string;
  current_stock?: number;
  buy_price: number;
  sell_price: number;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  created_at: string;
}

export interface Account {
  id: number;
  name: string;
  type: "cash" | "bank" | "mobile";
  balance: number;
}

export interface Sale {
  id: number;
  sale_date: string;
  customer_id?: number | null;
  total_amount: number;
  paid_amount: number;
  due_amount: number;
  profit: number;
  account_id?: number | null;
  note?: string | null;
}

export interface SaleItemInput {
  product_id: number;
  qty: number;
  sell_price: number;
}

export interface Expense {
  id: number;
  expense_date: string;
  category: string;
  amount: number;
  account_id?: number | null;
  note?: string | null;
}

export interface DailySummary {
  totalSell: number;
  cashReceived: number;
  dueAmount: number;
  profit: number;
  khoroch: number;
}
