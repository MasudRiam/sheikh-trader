import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";
import { getCustomers, createCustomer, getCustomersWithDue } from "@/app/lib/queries/customers";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("with_due") === "1") {
      return NextResponse.json(await getCustomersWithDue());
    }
    return NextResponse.json(await getCustomers());
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
    const row = await createCustomer(body);
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
