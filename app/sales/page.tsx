"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ShopShell } from "@/components/shop-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function SalesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["sales"],
    queryFn: async () => fetch("/api/sales").then((r) => r.json()),
  });
  return (
    <ShopShell>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Bikri</CardTitle>
            <Link href="/sales/new"><Button>New Bikri</Button></Link>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> : (
              <Table>
                <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead className="text-right">Mot</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Due</TableHead><TableHead className="text-right">Profit</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(data ?? []).map((s: { id: number; sale_date: string; customer_name: string | null; total_amount: string; paid_amount: string; due_amount: string; profit: string }) => (
                    <TableRow key={s.id}>
                      <TableCell>#{s.id}</TableCell><TableCell>{s.sale_date?.slice(0, 10)}</TableCell><TableCell>{s.customer_name ?? "-"}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.total_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.paid_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.due_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right tabular-nums">৳{Number(s.profit).toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </ShopShell>
  );
}
