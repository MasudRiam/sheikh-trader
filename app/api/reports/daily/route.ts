import { NextRequest, NextResponse } from "next/server";
import { getDailySummary } from "@/app/lib/queries/reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? undefined;
    return NextResponse.json(await getDailySummary(date));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
