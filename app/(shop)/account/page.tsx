"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { LogoutButton } from "@/components/logout-button";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

export default function AccountPage() {
  const qc = useQueryClient();
  const me = useQuery<{ id: number; username: string }>({
    queryKey: ["me"],
    queryFn: async () => {
      const r = await fetch("/api/auth/me");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });
  const [form, setForm] = useState({ current_password: "", new_password: "", confirm: "" });

  const changePw = useMutation({
    mutationFn: async () => {
      const r = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: form.current_password, new_password: form.new_password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed");
      return data;
    },
    onSuccess: () => {
      toast.success("Password changed. Other devices logged out.");
      setForm({ current_password: "", new_password: "", confirm: "" });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canSubmit =
    form.current_password.length > 0 &&
    form.new_password.length >= 8 &&
    form.new_password === form.confirm;

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Logged in as</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {me.isLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : (
              <p className="text-lg font-medium">{me.data?.username ?? "-"}</p>
            )}
            <div><LogoutButton /></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Min 8 characters. Other devices will be logged out.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div><Label className="mb-[2px]" htmlFor="pw-current">Current password</Label>
              <Input id="pw-current" type="password" autoComplete="current-password" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="mb-[2px]" htmlFor="pw-new">New password</Label>
                <Input id="pw-new" type="password" autoComplete="new-password" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} /></div>
              <div><Label className="mb-[2px]" htmlFor="pw-confirm">Confirm new</Label>
                <Input id="pw-confirm" type="password" autoComplete="new-password" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })} /></div>
            </div>
            {form.confirm && form.new_password !== form.confirm && (
              <p className="text-xs text-destructive">Passwords do not match.</p>
            )}
            <div><Button onClick={() => changePw.mutate()} disabled={changePw.isPending || !canSubmit}>
              {changePw.isPending && <Loader2Icon className="animate-spin" />}Update password
            </Button></div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
