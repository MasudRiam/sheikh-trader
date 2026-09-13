import { NextRequest, NextResponse } from "next/server";
import { getDueSales, collectDue } from "@/app/lib/queries/sales";

export async function GET() {
  try {
    return NextResponse.json(await getDueSales());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.amount == null) {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }
    const r = await collectDue(body);
    return NextResponse.json(r);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
