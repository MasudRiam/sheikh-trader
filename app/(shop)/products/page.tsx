"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";

export default function ProductsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<{ id: number; name: string; category: string; unit: string; current_stock: number; buy_price: string; sell_price: string }[]>({
    queryKey: ["products"],
    queryFn: async () => (await fetch("/api/products").then((r) => r.json())),
  });
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
    onSuccess: () => { toast.success("Product added"); setForm({ name: "", category: "AC_PARTS", buy_price: "", sell_price: "", current_stock: "0" }); qc.invalidateQueries({ queryKey: ["products"] }); },
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
    onSuccess: () => { toast.success("Stock added"); setStockIn({ product_id: "", qty: "", buy_price: "" }); qc.invalidateQueries({ queryKey: ["products"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New AC Part</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Compressor, Copper pipe..." /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <AppSelect value={form.category} onChange={(v) => setForm({ ...form, category: v || "AC_PARTS" })} options={categoryOptions} isSearchable={false} placeholder="Category" />
              </div>
              <div><Label>Opening stock</Label><Input type="number" value={form.current_stock} onChange={(e) => setForm({ ...form, current_stock: e.target.value })} /></div>
              <div><Label>Buy price</Label><Input type="number" value={form.buy_price} onChange={(e) => setForm({ ...form, buy_price: e.target.value })} /></div>
              <div><Label>Sell price</Label><Input type="number" value={form.sell_price} onChange={(e) => setForm({ ...form, sell_price: e.target.value })} /></div>
            </div>
            <Button onClick={() => addProduct.mutate()} disabled={addProduct.isPending}>Add product</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Stock In (Kena / Purchase)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label>Product</Label>
              <AppSelect
                value={stockIn.product_id}
                onChange={(v) => setStockIn({ ...stockIn, product_id: v })}
                options={(data ?? []).map((p) => ({ value: String(p.id), label: `${p.name} (stock ${p.current_stock})` }))}
                placeholder="Select product..."
                isClearable
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Qty</Label><Input type="number" value={stockIn.qty} onChange={(e) => setStockIn({ ...stockIn, qty: e.target.value })} /></div>
              <div><Label>Buy price</Label><Input type="number" value={stockIn.buy_price} onChange={(e) => setStockIn({ ...stockIn, buy_price: e.target.value })} /></div>
            </div>
            <Button onClick={() => addStock.mutate()} disabled={addStock.isPending}>Add stock</Button>
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
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Cat</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Buy</TableHead><TableHead className="text-right">Sell</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(data ?? []).map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.name}</TableCell><TableCell>{p.category}</TableCell>
                      <TableCell className="text-right tabular-nums">{p.current_stock}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{p.buy_price}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{p.sell_price}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
