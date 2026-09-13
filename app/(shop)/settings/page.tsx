"use client";

import { useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon, MonitorIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AppSelect } from "@/components/ui/app-select";
import { getDefaultPerPage, setDefaultPerPage } from "@/lib/settings";
import { toast } from "sonner";

const PER_PAGE_OPTIONS = [
  { value: "10", label: "10 / page" },
  { value: "20", label: "20 / page" },
  { value: "50", label: "50 / page" },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [perPage, setPerPage] = useState(getDefaultPerPage);

  const themes = [
    { value: "light", label: "Light", icon: <SunIcon /> },
    { value: "dark", label: "Dark", icon: <MoonIcon /> },
    { value: "system", label: "System", icon: <MonitorIcon /> },
  ];

  return (
    <>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
            <CardDescription>Light, dark, or follow this device</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {themes.map((t) => (
                <Button
                  key={t.value}
                  variant={theme === t.value ? "default" : "outline"}
                  onClick={() => setTheme(t.value)}
                >
                  {t.icon}{t.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Tables</CardTitle>
            <CardDescription>Default rows per page (this device)</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label className="mb-[2px]">Rows per page</Label>
              <AppSelect
                value={perPage}
                onChange={(v) => {
                  const next = v || "10";
                  setPerPage(next);
                  setDefaultPerPage(next);
                  toast.success(`Default: ${next} rows per page`);
                }}
                options={PER_PAGE_OPTIONS}
                isSearchable={false}
              />
            </div>
            <p className="text-muted-foreground text-xs">New table visits start with this size. You can still change it per table.</p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
