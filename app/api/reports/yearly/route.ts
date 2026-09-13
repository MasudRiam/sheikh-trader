import { NextRequest, NextResponse } from "next/server";
import { getYearlySummary } from "@/app/lib/queries/reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const year = Number(searchParams.get("year") ?? new Date().getFullYear());
    return NextResponse.json(await getYearlySummary(year));
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
