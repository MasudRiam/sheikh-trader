"use client";

import { Suspense, useCallback, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon, ShieldCheckIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const OTP_LENGTH = 6;

function OtpInputGroup({
  value,
  onChange,
}: {
  value: string;
  onChange: (otp: string) => void;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");

  const focusAt = (i: number) => inputs.current[i]?.focus();

  const update = useCallback(
    (arr: string[]) => onChange(arr.join("")),
    [onChange],
  );

  const handleChange = (i: number, v: string) => {
    // Take only the last typed digit
    const ch = v.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[i] = ch;
    update(next);
    if (ch && i < OTP_LENGTH - 1) focusAt(i + 1);
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = [...digits];
        next[i] = "";
        update(next);
      } else if (i > 0) {
        const next = [...digits];
        next[i - 1] = "";
        update(next);
        focusAt(i - 1);
      }
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      focusAt(i - 1);
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < OTP_LENGTH - 1) {
      focusAt(i + 1);
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    if (!pasted) return;
    const next = [...digits];
    for (let j = 0; j < pasted.length; j++) next[j] = pasted[j];
    update(next);
    focusAt(Math.min(pasted.length, OTP_LENGTH - 1));
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((d, i) => (
        <Input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          onFocus={(e) => e.target.select()}
          className="h-12 w-11 text-center text-lg font-semibold p-0"
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={i === 0}
        />
      ))}
    </div>
  );
}

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get("email") ?? "";
  const [email, setEmail] = useState(emailParam);
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending) return;
    setError("");
    setPending(true);
    try {
      const r = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setError(typeof data.error === "string" ? data.error : "Verification failed");
        return;
      }
      // Auto-logged in — go to dashboard
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="flex min-h-svh items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-button">
            <ShieldCheckIcon className="size-5" />
          </div>
          <CardTitle className="text-xl">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code to verify your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="flex flex-col gap-4">
            <div>
              <Label className="mb-[2px]" htmlFor="verify-email">Email</Label>
              <Input
                id="verify-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                readOnly={!!emailParam}
              />
            </div>
            <div>
              <Label className="mb-1.5 block text-center">OTP Code</Label>
              <OtpInputGroup value={otp} onChange={setOtp} />
            </div>
            {error && <p className="text-sm text-destructive text-center">{error}</p>}
            <Button type="submit" disabled={pending || otp.length !== OTP_LENGTH}>
              {pending && <Loader2Icon className="animate-spin" />}
              Verify & Login
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            OTP expires in 10 minutes. Check server logs or database for the code.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  );
}
