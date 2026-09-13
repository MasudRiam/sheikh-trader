"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";

const inputCls = "flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm";

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["expenses"], queryFn: async () => fetch("/api/expenses").then((r) => r.json()) });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const expenses: { id: number; expense_date: string; category: string; amount: string }[] = Array.isArray(data) ? data : [];
  const accountList: { id: number; name: string }[] = Array.isArray(accounts.data) ? accounts.data : [];
  const [form, setForm] = useState({ category: "general", amount: "", account_id: "", note: "" });

  const save = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/expenses", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: form.category, amount: Number(form.amount), account_id: form.account_id ? Number(form.account_id) : null, note: form.note || null }),
      });
      if (!r.ok) throw new Error((await r.json()).error || "Failed");
      return r.json();
    },
    onSuccess: () => { toast.success("Khoroch saved"); setForm({ category: "general", amount: "", account_id: "", note: "" }); qc.invalidateQueries({ queryKey: ["expenses"] }); qc.invalidateQueries({ queryKey: ["daily"] }); },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>New Khoroch</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Category</Label>
                <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  <option value="general">general</option><option value="rent">rent</option><option value="staff">staff</option><option value="transport">transport</option><option value="food">food</option><option value="other">other</option>
                </select>
              </div>
              <div><Label>Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div><Label>Account (kotha theke)</Label>
              <select className={inputCls} value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })}>
                <option value="">Select...</option>
                {(accountList).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div><Label>Note</Label><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>Save khoroch</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Khoroch</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Cat</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                {(expenses).map((e) => (
                  <TableRow key={e.id}><TableCell>{e.expense_date?.slice(0, 10)}</TableCell><TableCell>{e.category}</TableCell>
                    <TableCell className="text-right tabular-nums">৳{Number(e.amount).toLocaleString()}</TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
