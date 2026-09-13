import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";
import { getStockIns, createStockIn } from "@/app/lib/queries/stockIns";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    return NextResponse.json(await getStockIns(50));
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const body = await req.json();
    if (!body.product_id || !body.qty || body.buy_price == null) {
      return NextResponse.json({ error: "product_id, qty, buy_price required" }, { status: 400 });
    }
    const row = await createStockIn(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
