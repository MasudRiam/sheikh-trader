"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon } from "lucide-react"

export interface ShopSummary {
  totalSell: number
  cashReceived: number
  dueAmount: number
  profit: number
  khoroch: number
}

const fmt = (n: number) => `৳${n.toLocaleString("en-IN")}`

export function SectionCards({ data }: { data?: Partial<ShopSummary> }) {
  const s: ShopSummary = {
    totalSell: data?.totalSell ?? 0,
    cashReceived: data?.cashReceived ?? 0,
    dueAmount: data?.dueAmount ?? 0,
    profit: data?.profit ?? 0,
    khoroch: data?.khoroch ?? 0,
  }
  const net = s.profit - s.khoroch

  return (
    <div className="grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Ajker Bikri (Mot)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(s.totalSell)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Cash + Baki
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Cash {fmt(s.cashReceived)} + Baki {fmt(s.dueAmount)}
          </div>
          <div className="text-muted-foreground">
            Khata: Nagad + Baki = Mot (like 14,500 + 18,545)
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Cash Aday</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(s.cashReceived)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Received
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Haat-e cash today
          </div>
          <div className="text-muted-foreground">
            Goes to Cash / Bkash / Bank account
          </div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Baki (Due)</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(s.dueAmount)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDownIcon />
              Collect
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Customer due remaining
          </div>
          <div className="text-muted-foreground">Collect from Baki / Due page</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Labh - Khoroch = Net</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {fmt(net)}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUpIcon />
              Net
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Profit {fmt(s.profit)} - Khoroch {fmt(s.khoroch)}
          </div>
          <div className="text-muted-foreground">Daily closing hisab</div>
        </CardFooter>
      </Card>
    </div>
  )
}
