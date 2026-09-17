import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";
import { getDueSales, getDueSalesPaginated, collectDue } from "@/app/lib/queries/sales";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const { searchParams } = new URL(req.url);
    // Paginated object when page/perPage given (Baki Sales List); full array otherwise (dropdown)
    if (searchParams.has("page") || searchParams.has("perPage")) {
      const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
      const perPage = Math.min(Math.max(parseInt(searchParams.get("perPage") ?? "10", 10) || 10, 1), 100);
      const { rows, total } = await getDueSalesPaginated({ limit: perPage, offset: (page - 1) * perPage, userId: auth.user.id });
      return NextResponse.json({ rows, total, page, perPage, totalPages: Math.max(Math.ceil(total / perPage), 1) });
    }
    return NextResponse.json(await getDueSales(auth.user.id));
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
    if (body.amount == null) {
      return NextResponse.json({ error: "amount required" }, { status: 400 });
    }
    const r = await collectDue(body, auth.user.id);
    return NextResponse.json(r);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 400 },
    );
  }
}
