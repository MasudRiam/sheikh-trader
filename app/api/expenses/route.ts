import { NextRequest, NextResponse } from "next/server";
import { getExpenses, createExpense } from "@/app/lib/queries/expenses";

export async function GET() {
  try {
    return NextResponse.json(await getExpenses(50));
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
    const row = await createExpense(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
