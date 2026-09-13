import { NextRequest, NextResponse } from "next/server";
import { getSales, createSale } from "@/app/lib/queries/sales";

export async function GET() {
  try {
    const sales = await getSales(50);
    return NextResponse.json(sales);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch sales" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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
