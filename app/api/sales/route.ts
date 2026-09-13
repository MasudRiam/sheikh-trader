import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";
import { getSales, createSale } from "@/app/lib/queries/sales";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
    const perPage = Math.min(Math.max(parseInt(searchParams.get("perPage") ?? "10", 10) || 10, 1), 100);
    const { rows, total } = await getSales({ limit: perPage, offset: (page - 1) * perPage });
    return NextResponse.json({ rows, total, page, perPage, totalPages: Math.max(Math.ceil(total / perPage), 1) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const body = await req.json();
    if (!body.items || body.items.length === 0) {
      return NextResponse.json({ error: "items required" }, { status: 400 });
    }
    if (body.paid_amount == null) {
      return NextResponse.json({ error: "paid_amount required" }, { status: 400 });
    }
    const sale = await createSale(body);
    return NextResponse.json(sale, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to create sale" },
      { status: 400 },
    );
  }
}
