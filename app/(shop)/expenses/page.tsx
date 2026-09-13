"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppSelect } from "@/components/ui/app-select";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

type ExpenseRow = { id: number; expense_date: string; category: string; amount: string; note: string | null };
type ExpensesResponse = { rows: ExpenseRow[]; total: number; page: number; perPage: number; totalPages: number };

const PER_PAGE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export default function ExpensesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("10");
  const { data, isLoading } = useQuery<ExpensesResponse>({
    queryKey: ["expenses-table", page, perPage],
    queryFn: async () => fetch(`/api/expenses?page=${page}&perPage=${perPage}`).then((r) => r.json()),
    placeholderData: keepPreviousData,
  });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const expenses: ExpenseRow[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * Number(perPage) + 1;
  const to = Math.min(page * Number(perPage), total);
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
    onSuccess: () => {
      toast.success("Khoroch saved");
      setForm({ category: "general", amount: "", account_id: "", note: "" });
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["expenses-table"] }); qc.invalidateQueries({ queryKey: ["daily"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Khoroch</CardTitle>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger render={<Button><PlusIcon />Add Khoroch</Button>} />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Khoroch</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-3">
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
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : expenses.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No khoroch yet.</p>
            ) : (
              <>
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
