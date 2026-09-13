"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AppSelect } from "@/components/ui/app-select";

type SaleRow = {
  id: number;
  sale_date: string;
  customer_name: string | null;
  total_qty: number;
  total_amount: string;
  paid_amount: string;
  due_amount: string;
  profit: string;
};

type SalesResponse = {
  rows: SaleRow[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
};

const PER_PAGE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export default function SalesPage() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState("10");
  const { data, isLoading } = useQuery<SalesResponse>({
    queryKey: ["sales", page, perPage],
    queryFn: async () => fetch(`/api/sales?page=${page}&perPage=${perPage}`).then((r) => r.json()),
    placeholderData: keepPreviousData,
  });
  const rows = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const from = total === 0 ? 0 : (page - 1) * Number(perPage) + 1;
  const to = Math.min(page * Number(perPage), total);

  return (
    <>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bikri</CardTitle>
            <Link href="/sales/new"><Button>New Bikri</Button></Link>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : rows.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">No bikri yet. Create one from New Bikri.</p>
            ) : (
              <>
                <Table>
                  <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rows.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell>#{s.id}</TableCell><TableCell>{s.sale_date?.slice(0, 10)}</TableCell><TableCell>{s.customer_name ?? "-"}</TableCell>
                        <TableCell className="text-right tabular-nums">{s.total_qty}</TableCell>
                        <TableCell className="text-right tabular-nums">৳{Number(s.total_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">৳{Number(s.paid_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">৳{Number(s.due_amount).toLocaleString()}</TableCell>
                        <TableCell className="text-right tabular-nums">৳{Number(s.profit).toLocaleString()}</TableCell>
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
