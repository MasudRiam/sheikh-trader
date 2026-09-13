"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSelect } from "@/components/ui/app-select";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

type Product = { id: number; name: string; category: string; unit: string; current_stock: number; buy_price: string; sell_price: string };
type ProductsResponse = { rows: Product[]; total: number; page: number; perPage: number; totalPages: number };

const PER_PAGE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export default function ProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("10");
  // Full list for the Stock-In dropdown (no pagination params)
  const { data } = useQuery<Product[]>({
    queryKey: ["products"],
    queryFn: async () => (await fetch("/api/products").then((r) => r.json())),
  });
  // Server-paginated stock table
  const table = useQuery<ProductsResponse>({
    queryKey: ["products-table", page, perPage],
    queryFn: async () => (await fetch(`/api/products?page=${page}&perPage=${perPage}`).then((r) => r.json())),
    placeholderData: keepPreviousData,
  });
  const isLoading = table.isLoading;
  const stockRows = table.data?.rows ?? [];
  const total = table.data?.total ?? 0;
  const totalPages = table.data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * Number(perPage) + 1;
  const to = Math.min(page * Number(perPage), total);
  const [form, setForm] = useState({ name: "", category: "AC_PARTS", buy_price: "", sell_price: "", current_stock: "0" });
  const [stockIn, setStockIn] = useState({ product_id: "", qty: "", buy_price: "" });

  const categoryOptions = [
    { value: "AC_PARTS", label: "AC_PARTS" },
    { value: "AC", label: "AC" },
    { value: "TV", label: "TV" },
    { value: "OTHER", label: "OTHER" },
  ];

  const addProduct = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/products", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, buy_price: Number(form.buy_price), sell_price: Number(form.sell_price), current_stock: Number(form.current_stock) }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Product added"); setForm({ name: "", category: "AC_PARTS", buy_price: "", sell_price: "", current_stock: "0" }); qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["products-table"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  const addStock = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/stock-ins", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: Number(stockIn.product_id), qty: Number(stockIn.qty), buy_price: Number(stockIn.buy_price) }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Stock added"); setStockIn({ product_id: "", qty: "", buy_price: "" }); qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["products-table"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Add New Product</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label className="mb-[2px]">Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Compressor, Copper pipe..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-[2px]">Category</Label>
                <AppSelect value={form.category} onChange={(v) => setForm({ ...form, category: v || "AC_PARTS" })} options={categoryOptions} isSearchable={false} placeholder="Category" />
              </div>
              <div><Label className="mb-[2px]">Opening stock</Label><Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></div>
              <div><Label className="mb-[2px]">Buy price</Label><Input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} /></div>
              <div><Label className="mb-[2px]">Sell price</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} /></div>
            </div>
            <Button onClick={() => addProduct.mutate()} disabled={addProduct.isPending}>{addProduct.isPending && <Loader2Icon className="animate-spin" />}Add product</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock In (Kena / Purchase)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label className="mb-[2px]">Product</Label>
              <AppSelect
                value={stockIn.product_id}
                onChange={(v) => setStockIn({ ...stockIn, product_id: v })}
                options={(data ?? []).map((p) => ({ value: String(p.id), label: `${p.name} (stock ${p.current_stock})` }))}
                placeholder="Select product..."
                isClearable
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-[2px]">Qty</Label><Input type="number" value={stockIn.qty} onChange={(e) => setStockIn({ ...stockIn, qty: e.target.value })} /></div>
              <div><Label className="mb-[2px]">Buy price</Label><Input type="number" value={stockIn.buy_price} onChange={(e) => setStockIn({ ...stockIn, buy_price: e.target.value })} /></div>
            </div>
            <Button onClick={() => addStock.mutate()} disabled={addStock.isPending}>{addStock.isPending && <Loader2Icon className="animate-spin" />}Add stock</Button>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Stock List</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : stockRows.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No products yet. Add one from New AC Part.</p>
            ) : (
              <>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Cat</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Buy</TableHead><TableHead className="text-right">Sell</TableHead></TableRow></TableHeader>
                <TableBody>
                  {stockRows.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell><TableCell>{p.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.current_stock}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{p.buy_price}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{p.sell_price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-muted-foreground text-sm tabular-nums">
                  Showing {from}–{to} of {total}
                </span>
                <div className="ml-auto flex items-center gap-2">
                  <div className="w-32">
                    <AppSelect
                      value={perPage}
                      onChange={(v) => { setPerPage(v || "10"); setPage(1); }}
                      options={PER_PAGE_OPTIONS}
                      isSearchable={false}
                    />
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(p - 1, 1))} disabled={page <= 1}>
                    <ChevronLeftIcon />Prev
                  </Button>
                  <span className="text-sm tabular-nums">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(p + 1, totalPages))} disabled={page >= totalPages}>
                    Next<ChevronRightIcon />
                  </Button>
                </div>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
