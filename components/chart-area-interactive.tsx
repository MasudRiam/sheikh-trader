"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import { useQuery } from "@tanstack/react-query";

import { useIsMobile } from "@/hooks/use-mobile";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";

export const description = "Bikri overview - cash vs baki (live)";

const chartConfig = {
  cash: {
    label: "Cash",
    color: "var(--primary)",
  },
  baki: {
    label: "Baki",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function toISO(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function ChartAreaInteractive() {
  const isMobile = useIsMobile();
  const [timeRange, setTimeRange] = React.useState("30d");

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d");
    }
  }, [isMobile]);

  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const { data, isLoading } = useQuery({
    queryKey: ["chart-range", days],
    queryFn: async () => {
      const to = toISO(new Date());
      const from = toISO(new Date(Date.now() - (days - 1) * 86400000));
      const r = await fetch(`/api/reports/range?from=${from}&to=${to}`);
      if (!r.ok) throw new Error("chart failed");
      return r.json() as Promise<{
        rows: { date: string; cashReceived: number; dueAmount: number }[];
      }>;
    },
  });

  const chartData = (data?.rows ?? []).map((r) => ({
    date: r.date,
    cash: Number(r.cashReceived),
    baki: Number(r.dueAmount),
  }));

  const label =
    timeRange === "7d"
      ? "Last 7 days"
      : timeRange === "30d"
        ? "Last 30 days"
        : "Last 3 months";

  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Bikri Overview</CardTitle>
        <CardDescription>
          <span className="hidden @[540px]/card:block">
            Cash + Baki — {label} (live)
          </span>
          <span className="@[540px]/card:hidden">{label}</span>
        </CardDescription>
        <CardAction>
          <ToggleGroup
            multiple={false}
            value={timeRange ? [timeRange] : []}
            onValueChange={(value) => {
              setTimeRange(value[0] ?? "30d");
            }}
            variant="outline"
            className="hidden *:data-[slot=toggle-group-item]:px-4! @[767px]/card:flex"
          >
            <ToggleGroupItem value="90d">Last 3 months</ToggleGroupItem>
            <ToggleGroupItem value="30d">Last 30 days</ToggleGroupItem>
            <ToggleGroupItem value="7d">Last 7 days</ToggleGroupItem>
          </ToggleGroup>
          <Select
            value={timeRange}
            onValueChange={(value) => {
              if (value !== null) {
                setTimeRange(value);
              }
            }}
          >
            <SelectTrigger
              className="flex w-40 **:data-[slot=select-value]:block **:data-[slot=select-value]:truncate @[767px]/card:hidden"
              size="sm"
              aria-label="Select a value"
            >
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                Last 3 months
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                Last 30 days
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                Last 7 days
              </SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {isLoading ? (
          <Skeleton className="h-[250px] w-full" />
        ) : chartData.length === 0 ? (
          <p className="text-sm text-muted-foreground px-4 pb-6">
            No bikri in this period yet. Add a sale from Bikri page.
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="aspect-auto h-[250px] w-full"
          >
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="fillCash" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-cash)"
                    stopOpacity={1.0}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-cash)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
                <linearGradient id="fillBaki" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--color-baki)"
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--color-baki)"
                    stopOpacity={0.1}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={32}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => {
                      return new Date(value).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      });
                    }}
                    indicator="dot"
                  />
                }
              />
              <Area
                dataKey="baki"
                type="natural"
                fill="url(#fillBaki)"
                stroke="var(--color-baki)"
                stackId="a"
              />
              <Area
                dataKey="cash"
                type="natural"
                fill="url(#fillCash)"
                stroke="var(--color-cash)"
                stackId="a"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
