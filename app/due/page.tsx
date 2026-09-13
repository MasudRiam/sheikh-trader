"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShopShell } from "@/components/shop-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const inputCls = "flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm";

export default function DuePage() {
  const qc = useQueryClient();
  const dues = useQuery({ queryKey: ["dues"], queryFn: async () => fetch("/api/due").then((r) => r.json()) });
  const customers = useQuery({ queryKey: ["customers-due"], queryFn: async () => fetch("/api/customers?with_due=1").then((r) => r.json()) });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const [form, setForm] = useState({ sale_id: "", amount: "", account_id: "" });

  const collect = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/due", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sale_id: form.sale_id ? Number(form.sale_id) : null, amount: Number(form.amount), account_id: form.account_id ? Number(form.account_id) : null }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => {
      toast.success("Due collected");
      setForm({ sale_id: "", amount: "", account_id: "" });
      qc.invalidateQueries({ queryKey: ["dues"] }); qc.invalidateQueries({ queryKey: ["customers-due"] }); qc.invalidateQueries({ queryKey: ["daily"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <ShopShell>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Due Collect (Takaa Aday)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label>Baki sale</Label>
              <select className={inputCls} value={form.sale_id} onChange={(e) => setForm({ ...form, sale_id: e.target.value })}>
                <option value="">Select sale...</option>
                {(dues.data ?? []).map((s: { id: number; customer_name: string | null; due_amount: string }) => (
                  <option key={s.id} value={s.id}>#{s.id} {s.customer_name ?? ""} — due ৳{Number(s.due_amount).toLocaleString()}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>Account</Label>
                <select className={inputCls} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                  <option value="">Select...</option>
                  {(accounts.data ?? []).map((a: { id: number; name: string }) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
            </div>
            <Button onClick={() => collect.mutate()} disabled={collect.isPending}>Collect</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Customer-wise Due</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Phone</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
              <TableBody>
                {(customers.data ?? []).filter((c: { total_due: string }) => Number(c.total_due) > 0).map((c: { id: number; name: string; phone: string | null; total_due: string }) => (
                  <TableRow key={c.id}><TableCell>{c.name}</TableCell><TableCell>{c.phone ?? "-"}</TableCell><TableCell className="text-right tabular-nums">৳{Number(c.total_due).toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Baki Sales List</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Mot</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
              <TableBody>
                {(dues.data ?? []).map((s: { id: number; customer_name: string | null; total_amount: string; due_amount: string }) => (
                  <TableRow key={s.id}><TableCell>#{s.id}</TableCell><TableCell>{s.customer_name ?? "-"}</TableCell>
                    <TableCell className="text-right tabular-nums">৳{Number(s.total_amount).toLocaleString()}</TableCell>
                    <TableCell className="text-right tabular-nums">৳{Number(s.due_amount).toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </ShopShell>
  );
}
