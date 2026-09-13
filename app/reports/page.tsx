"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShopShell } from "@/components/shop-shell";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const fmt = (n: number) => `৳${Number(n || 0).toLocaleString("en-IN")}`;
const toISO = (d: Date) => d.toISOString().slice(0, 10);
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Mode = "week" | "month" | "year" | "custom";

export default function ReportsPage() {
  const today = useMemo(() => new Date(), []);
  const [mode, setMode] = useState<Mode>("week");
  const [custom, setCustom] = useState({ from: toISO(new Date(Date.now() - 6 * 86400000)), to: toISO(today) });
  const [year, setYear] = useState(String(today.getFullYear()));

  const rangeParams = useMemo(() => {
    if (mode === "week") return { from: toISO(new Date(Date.now() - 6 * 86400000)), to: toISO(today) };
    if (mode === "month") {
      const y = today.getFullYear(), m = today.getMonth();
      return { from: toISO(new Date(y, m, 1)), to: toISO(today) };
    }
    return custom;
  }, [mode, custom, today]);

  const rangeQuery = useQuery({
    queryKey: ["reports-range", rangeParams.from, rangeParams.to, mode],
    queryFn: async () => fetch(`/api/reports/range?from=${rangeParams.from}&to=${rangeParams.to}`).then((r) => {
      if (!r.ok) throw new Error("Failed");
      return r.json();
    }),
    enabled: mode !== "year",
  });

  const yearQuery = useQuery({
    queryKey: ["reports-year", year],
    queryFn: async () => fetch(`/api/reports/yearly?year=${year}`).then((r) => {
      if (!r.ok) throw new Error("Failed");
      return r.json();
    }),
    enabled: mode === "year",
  });

  const isYear = mode === "year";
  const totals = isYear ? yearQuery.data?.totals : rangeQuery.data?.totals;
  const loading = isYear ? yearQuery.isLoading : rangeQuery.isLoading;

  const cards = [
    { label: "Mot Bikri", value: totals?.totalSell ?? 0 },
    { label: "Cash", value: totals?.cashReceived ?? 0 },
    { label: "Baki", value: totals?.dueAmount ?? 0 },
    { label: "Labh (Profit)", value: totals?.profit ?? 0 },
    { label: "Khoroch", value: totals?.khoroch ?? 0 },
    { label: "Net (Mot-Khoroch)", value: totals?.net ?? 0 },
  ];

  return (
    <ShopShell>
      <div className="flex flex-wrap gap-2 px-4 lg:px-6">
        {(["week", "month", "year", "custom"] as Mode[]).map((m) => (
          <Button key={m} variant={mode === m ? "default" : "outline"} size="sm" onClick={() => setMode(m)}>
            {m === "week" ? "Weekly (7 din)" : m === "month" ? "Monthly (cholti mash)" : m === "year" ? "Yearly" : "Custom"}
          </Button>
        ))}
        {mode === "year" && (
          <Input className="w-28" value={year} onChange={(e) => setYear(e.target.value)} placeholder="2026" />
        )}
        {mode === "custom" && (
          <div className="flex items-center gap-2">
            <div><Label>From</Label><Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></div>
            <div><Label>To</Label><Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-6 @xl/main:grid-cols-3">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-1"><CardTitle className="text-sm font-normal text-muted-foreground">{c.label}</CardTitle></CardHeader>
            <CardContent><div className="text-xl font-semibold tabular-nums">{loading ? "..." : fmt(c.value)}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>

      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>{isYear ? `Monthly breakdown — ${year}` : `Daily breakdown — ${rangeParams.from} to ${rangeParams.to}`}</CardTitle></CardHeader>
          <CardContent>
            {loading ? <p className="text-sm text-muted-foreground">Loading...</p> : isYear ? (
              <Table>
                <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Mot</TableHead><TableHead className="text-right">Cash</TableHead><TableHead className="text-right">Baki</TableHead><TableHead className="text-right">Labh</TableHead><TableHead className="text-right">Khoroch</TableHead><TableHead className="text-right">Net</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(yearQuery.data?.rows ?? []).map((r: { month: number; totalSell: number; cashReceived: number; dueAmount: number; profit: number; khoroch: number; net: number }) => (
                    <TableRow key={r.month}>
                      <TableCell>{MONTHS[r.month - 1]}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.totalSell)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.cashReceived)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.dueAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.profit)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.khoroch)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead className="text-right">Mot</TableHead><TableHead className="text-right">Cash</TableHead><TableHead className="text-right">Baki</TableHead><TableHead className="text-right">Labh</TableHead><TableHead className="text-right">Khoroch</TableHead><TableHead className="text-right">Net</TableHead></TableRow></TableHeader>
                <TableBody>
                  {(rangeQuery.data?.rows ?? []).map((r: { date: string; totalSell: number; cashReceived: number; dueAmount: number; profit: number; khoroch: number; net: number }) => (
                    <TableRow key={r.date}>
                      <TableCell>{r.date}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.totalSell)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.cashReceived)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.dueAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.profit)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.khoroch)}</TableCell>
                      <TableCell className="text-right tabular-nums">{fmt(r.net)}</TableCell>
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
