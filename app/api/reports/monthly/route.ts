import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";
import { getMonthlySummary } from "@/app/lib/queries/reports";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = Number(searchParams.get("year") ?? now.getFullYear());
    const month = Number(searchParams.get("month") ?? now.getMonth() + 1);
    return NextResponse.json(await getMonthlySummary(year, month, auth.user.id));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
