import { NextRequest, NextResponse } from "next/server";
import { getRangeSummary } from "@/app/lib/queries/reports";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data = await getRangeSummary(
      searchParams.get("from") ?? undefined,
      searchParams.get("to") ?? undefined,
    );
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
