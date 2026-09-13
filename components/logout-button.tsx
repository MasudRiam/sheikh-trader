"use client";

import { useState } from "react";
import { Loader2Icon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const logout = async () => {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      window.location.href = "/login";
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={logout} disabled={pending}>
      {pending ? <Loader2Icon className="animate-spin" /> : <LogOutIcon />}
      Logout
    </Button>
  );
}
