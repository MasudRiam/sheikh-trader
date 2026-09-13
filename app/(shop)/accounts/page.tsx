"use client";

import { Cell, Pie, PieChart } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];

type Account = { id: number; name: string; type: string; balance: string | number };

export default function AccountsPage() {
  const { data, isLoading } = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const accounts: Account[] = Array.isArray(data) ? data : [];
  const total = accounts.reduce((a, x) => a + Number(x.balance), 0);

  const chartData = accounts.map((a, i) => ({
    name: a.name,
    value: Number(a.balance),
    fill: COLORS[i % COLORS.length],
  }));
  const chartConfig = Object.fromEntries(
    accounts.map((a, i) => [a.name, { label: a.name, color: COLORS[i % COLORS.length] }]),
  ) satisfies ChartConfig;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Accounts (Cash / DBBL / BRAC / Bkash)</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {accounts.map((a) => (
                <TableRow key={a.id}><TableCell>{a.name} ({a.type})</TableCell>
                  <TableCell className="text-right tabular-nums">৳{Number(a.balance).toLocaleString()}</TableCell></TableRow>
              ))}
              <TableRow><TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-medium tabular-nums">৳{total.toLocaleString()}</TableCell></TableRow>
            </TableBody></Table>
            <p className="text-muted-foreground mt-3 text-sm">Balance auto-updates on bikri (paid+), due collect (+), expense (-).</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Balance Share</CardTitle>
            <CardDescription>How much money is in each account</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : total <= 0 ? (
              <p className="text-muted-foreground px-1 pb-6 text-sm">No balance yet. Bikri save korle ekhane share dekhabe.</p>
            ) : (
              <>
                <ChartContainer config={chartConfig} className="mx-auto aspect-square h-[250px]">
                  <PieChart>
                    <ChartTooltip
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `৳${Number(value).toLocaleString()}`}
                          indicator="dot"
                        />
                      }
                    />
                    <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={60} strokeWidth={2}>
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>
                <div className="mt-2 flex flex-col gap-1.5">
                  {chartData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2 text-sm">
                      <span className="size-2.5 rounded-full" style={{ background: d.fill }} />
                      <span className="flex-1">{d.name}</span>
                      <span className="text-muted-foreground tabular-nums">{total > 0 ? Math.round((d.value / total) * 100) : 0}%</span>
                      <span className="w-24 text-right font-medium tabular-nums">৳{d.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
