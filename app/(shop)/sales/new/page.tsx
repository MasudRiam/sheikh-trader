"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";

export default function NewSalePage() {
  const qc = useQueryClient();
  const products = useQuery<{ id: number; name: string; current_stock: number; sell_price: string }[]>({ queryKey: ["products"], queryFn: async () => fetch("/api/products").then((r) => r.json()) });
  const accounts = useQuery<{ id: number; name: string }[]>({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const [lines, setLines] = useState<{ product_id: number; qty: number; sell_price: number }[]>([]);
  const [pick, setPick] = useState({ product_id: "", qty: "1" });
  const [customer_name, setCustomerName] = useState("");
  const [customer_phone, setCustomerPhone] = useState("");
  const [paid, setPaid] = useState("");
  const [account_id, setAccountId] = useState("");

  const productOptions = (products.data ?? []).map((p) => ({
    value: String(p.id),
    label: `${p.name} | st ${p.current_stock} | ৳${p.sell_price}`,
  }));
  const accountOptions = (accounts.data ?? []).map((a) => ({
    value: String(a.id),
    label: a.name,
  }));

  const total = lines.reduce((a, l) => a + l.qty * l.sell_price, 0);
  const paidNum = Number(paid || 0);
  const due = total - paidNum;

  const addLine = () => {
    const p = (products.data ?? []).find((x) => x.id === Number(pick.product_id));
    if (!p) return toast.error("Select product");
    const qty = Number(pick.qty);
    if (!(qty > 0)) return toast.error("Qty invalid");
    if (qty > p.current_stock) return toast.error(`Stock only ${p.current_stock}`);
    setLines([...lines, { product_id: p.id, qty, sell_price: Number(p.sell_price) }]);
    setPick({ product_id: "", qty: "1" });
  };

  const submit = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/sales", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines, paid_amount: paidNum,
          account_id: account_id ? Number(account_id) : null,
          customer_name: customer_name || null, customer_phone: customer_phone || null,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Bikri saved, stock minus done");
      setLines([]); setPaid(""); setCustomerName(""); setCustomerPhone("");
      qc.invalidateQueries({ queryKey: ["products"] }); qc.invalidateQueries({ queryKey: ["daily"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New Bikri (POS)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_80px_auto] gap-2">
              <AppSelect value={pick.product_id} onChange={(v) => setPick({ ...pick, product_id: v })} options={productOptions} placeholder="Part select..." />
              <Input type="number" value={pick.qty} onChange={(e) => setPick({ ...pick, qty: e.target.value })} />
              <Button onClick={addLine}>Add</Button>
            </div>
            {lines.map((l, i) => {
              const p = (products.data ?? []).find((x) => x.id === l.product_id);
              return (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="flex-1">{p?.name} × {l.qty}</span>
                  <Input className="w-24" type="number" value={l.sell_price}
                    onChange={(e) => setLines(lines.map((x, j) => j === i ? { ...x, sell_price: Number(e.target.value) } : x))} />
                  <span className="w-20 text-right tabular-nums">৳{(l.qty * l.sell_price).toLocaleString()}</span>
                  <Button variant="outline" size="sm" onClick={() => setLines(lines.filter((_, j) => j !== i))}>x</Button>
                </div>
              );
            })}
            <div className="text-right font-medium tabular-nums">Mot: ৳{total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Payment (Nagad / Baki)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Customer name (baki hole)</Label><Input value={customer_name} onChange={(e) => setCustomerName(e.target.value)} placeholder="Mistri / customer" /></div>
              <div><Label>Phone</Label><Input value={customer_phone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Paid amount</Label><Input type="number" value={paid} onChange={(e) => setPaid(e.target.value)} /></div>
              <div><Label>Account</Label>
                <AppSelect value={account_id} onChange={setAccountId} options={accountOptions} placeholder="Select account..." isClearable />
              </div>
            </div>
            <div className="text-sm">Due (Baki): <span className="font-medium tabular-nums">৳{due.toLocaleString()}</span></div>
            <Button onClick={() => submit.mutate()} disabled={submit.isPending || lines.length === 0}>
              Save Bikri {due > 0 ? ` (Baki ৳${due.toLocaleString()})` : "(Full cash)"}
            </Button>
            {due > 0 && !customer_name && <p className="text-xs text-amber-600">Baki bikri te customer name dile hisab clear thakbe.</p>}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
