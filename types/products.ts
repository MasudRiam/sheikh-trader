export interface Product {
  id: number;
  name: string;
  category: "AC" | "TV";
  unit: string;
  current_stock: number;
  buy_price: number;
  sell_price: number;
  created_at: string;
  updated_at: string;
}

export interface CreateProductInput {
  name: string;
  category: "AC" | "TV";
  unit?: string;
  current_stock?: number;
  buy_price: number;
  sell_price: number;
}
