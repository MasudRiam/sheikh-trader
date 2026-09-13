import { NextRequest, NextResponse } from "next/server";
import { getExpenses, getExpensesPaginated, createExpense } from "@/app/lib/queries/expenses";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Paginated object when page/perPage given (Recent Expenses table); full array otherwise
    if (searchParams.has("page") || searchParams.has("perPage")) {
      const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
      const perPage = Math.min(Math.max(parseInt(searchParams.get("perPage") ?? "10", 10) || 10, 1), 100);
      const { rows, total } = await getExpensesPaginated({ limit: perPage, offset: (page - 1) * perPage });
      return NextResponse.json({ rows, total, page, perPage, totalPages: Math.max(Math.ceil(total / perPage), 1) });
    }
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
