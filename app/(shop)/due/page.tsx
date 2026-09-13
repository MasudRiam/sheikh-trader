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

type DueRow = { id: number; customer_name: string | null; total_amount: string; due_amount: string };
type DuesResponse = { rows: DueRow[]; total: number; page: number; perPage: number; totalPages: number };

const PER_PAGE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export default function DuePage() {
  const qc = useQueryClient();
  // Full list for the Collect dropdown (no pagination params)
  const dues = useQuery({ queryKey: ["dues"], queryFn: async () => fetch("/api/due").then((r) => r.json()) });
  // Server-paginated Baki Sales List
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("10");
  const duesTable = useQuery<DuesResponse>({
    queryKey: ["dues-table", page, perPage],
    queryFn: async () => fetch(`/api/due?page=${page}&perPage=${perPage}`).then((r) => r.json()),
    placeholderData: keepPreviousData,
  });
  const dueRows: DueRow[] = duesTable.data?.rows ?? [];
  const total = duesTable.data?.total ?? 0;
  const totalPages = duesTable.data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * Number(perPage) + 1;
  const to = Math.min(page * Number(perPage), total);
  const customers = useQuery({ queryKey: ["customers-due"], queryFn: async () => fetch("/api/customers?with_due=1").then((r) => r.json()) });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const [form, setForm] = useState({ sale_id: "", amount: "", account_id: "" });

  const saleOptions = (dues.data ?? []).map((s: { id: number; customer_name: string | null; due_amount: string }) => ({
    value: String(s.id),
    label: `#${s.id} ${s.customer_name ?? ""} — due ৳${Number(s.due_amount).toLocaleString()}`,
  }));
  const accountOptions = (accounts.data ?? []).map((a: { id: number; name: string }) => ({
    value: String(a.id),
    label: a.name,
  }));

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
      qc.invalidateQueries({ queryKey: ["dues"] }); qc.invalidateQueries({ queryKey: ["dues-table"] }); qc.invalidateQueries({ queryKey: ["customers-due"] }); qc.invalidateQueries({ queryKey: ["daily"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Due Collect (Takaa Aday)</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label className="mb-[2px]">Baki sale</Label>
              <AppSelect value={form.sale_id} onChange={(v) => setForm({ ...form, sale_id: v })} options={saleOptions} placeholder="Select sale..." isClearable />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-[2px]">Amount</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label className="mb-[2px]">Account</Label>
                <AppSelect value={form.account_id} onChange={(v) => setForm({ ...form, account_id: v })} options={accountOptions} placeholder="Select..." isClearable />
              </div>
            </div>
            <Button onClick={() => collect.mutate()} disabled={collect.isPending}>{collect.isPending && <Loader2Icon className="animate-spin" />}Collect</Button>
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
            {duesTable.isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : dueRows.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No due left. All clear!</p>
            ) : (
              <>
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Due</TableHead></TableRow></TableHeader>
                <TableBody>
                  {dueRows.map((s) => (
                    <TableRow key={s.id}><TableCell>#{s.id}</TableCell><TableCell>{s.customer_name ?? "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.due_amount).toLocaleString()}</TableCell></TableRow>
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
