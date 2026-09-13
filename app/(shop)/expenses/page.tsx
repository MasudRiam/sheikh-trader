"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AppSelect } from "@/components/ui/app-select";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function ExpensesPage() {
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["expenses"], queryFn: async () => fetch("/api/expenses").then((r) => r.json()) });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const expenses: { id: number; expense_date: string; category: string; amount: string; note: string | null }[] = Array.isArray(data) ? data : [];
  const accountList: { id: number; name: string }[] = Array.isArray(accounts.data) ? accounts.data : [];
  const [form, setForm] = useState({ category: "general", amount: "", account_id: "", note: "" });

  const categoryOptions = [
    { value: "general", label: "general" },
    { value: "rent", label: "rent" },
    { value: "staff", label: "staff" },
    { value: "transport", label: "transport" },
    { value: "food", label: "food" },
    { value: "other", label: "other" },
  ];
  const accountOptions = accountList.map((a) => ({ value: String(a.id), label: a.name }));

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
              <div><Label className="mb-[2px]">Category</Label>
                <AppSelect value={form.category} onChange={(v) => setForm({ ...form, category: v || "general" })} options={categoryOptions} isSearchable={false} placeholder="Category" />
              </div>
              <div><Label className="mb-[2px]">Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
            </div>
            <div><Label className="mb-[2px]">Account (kotha theke)</Label>
              <AppSelect value={form.account_id} onChange={(v) => setForm({ ...form, account_id: v })} options={accountOptions} placeholder="Select..." isClearable />
            </div>
            <div><Label className="mb-[2px]" htmlFor="expense-note">Note</Label><textarea id="expense-note" rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Details likhun..." className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30" /></div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>{save.isPending && <Loader2Icon className="animate-spin" />}Save khoroch</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recent Khoroch</CardTitle></CardHeader>
          <CardContent>
            <TooltipProvider>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Note</TableHead></TableRow></TableHeader>
              <TableBody>
                {(expenses).map((e) => (
                  <TableRow key={e.id}><TableCell>{e.expense_date?.slice(0, 10)}</TableCell><TableCell>{e.category}</TableCell>
                    <TableCell className="text-right tabular-nums">৳{Number(e.amount).toLocaleString()}</TableCell>
                    <TableCell className="max-w-[180px]">
                      {e.note ? (
                        <Tooltip>
                          <TooltipTrigger className="block max-w-full cursor-help truncate text-left text-muted-foreground">{e.note}</TooltipTrigger>
                          <TooltipContent className="max-w-xs whitespace-normal break-words">{e.note}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell></TableRow>
                ))}
              </TableBody>
            </Table>
            </TooltipProvider>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
