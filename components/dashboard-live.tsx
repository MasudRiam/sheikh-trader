"use client";

import { useQuery } from "@tanstack/react-query";
import { SectionCards } from "@/components/section-cards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-IN")}`;

async function fetchDaily() {
  const r = await fetch("/api/reports/daily");
  if (!r.ok) throw new Error("daily failed");
  return r.json();
}

async function fetchAccounts() {
  const r = await fetch("/api/accounts");
  if (!r.ok) return [];
  return r.json();
}

export function DashboardLive() {
  const daily = useQuery({ queryKey: ["daily"], queryFn: fetchDaily });
  const accounts = useQuery({ queryKey: ["accounts"], queryFn: fetchAccounts });
  const d = daily.data ?? { totalSell: 0, cashReceived: 0, dueAmount: 0, profit: 0, khoroch: 0 };
  const accs: { id: number; name: string; balance: string | number }[] = accounts.data ?? [];
  const accTotal = accs.reduce((a, x) => a + Number(x.balance), 0);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <SectionCards data={d} />
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ajker Hisab Closing (Khata style)</CardTitle>
          </CardHeader>
          <CardContent>
            {daily.isLoading ? (
              <div className="flex flex-col gap-2">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            ) : (
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell>Nagad Bikri (Cash)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.cashReceived)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Baki Bikri (Due)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.dueAmount)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Mot Bikri</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">{fmt(d.totalSell)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Expense</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.khoroch)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Net (Mot - Expense)</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {fmt(d.totalSell - d.khoroch)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Labh (Profit)</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(d.profit)}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Account Balances</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {accs.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>{a.name}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmt(Number(a.balance))}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell className="font-medium">Total</TableCell>
                  <TableCell className="text-right font-medium tabular-nums">{fmt(accTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
