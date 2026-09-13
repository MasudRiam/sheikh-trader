"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export default function AccountsPage() {
  const { data } = useQuery({ queryKey: ["accounts"], queryFn: async () => fetch("/api/accounts").then((r) => r.json()) });
  const total = (data ?? []).reduce((a: number, x: { balance: string | number }) => a + Number(x.balance), 0);
  return (
    <>
      <div className="px-4 lg:px-6">
        <Card>
          <CardHeader><CardTitle>Accounts (Cash / DBBL / BRAC / Bkash)</CardTitle></CardHeader>
          <CardContent>
            <Table><TableBody>
              {(data ?? []).map((a: { id: number; name: string; type: string; balance: string | number }) => (
                <TableRow key={a.id}><TableCell>{a.name} ({a.type})</TableCell>
                  <TableCell className="text-right tabular-nums">৳{Number(a.balance).toLocaleString()}</TableCell></TableRow>
              ))}
              <TableRow><TableCell className="font-medium">Total</TableCell>
                <TableCell className="text-right font-medium tabular-nums">৳{total.toLocaleString()}</TableCell></TableRow>
            </TableBody></Table>
            <p className="text-muted-foreground mt-3 text-sm">Balance auto-updates on bikri (paid+), due collect (+), khoroch (-).</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
