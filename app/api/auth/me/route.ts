import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/app/lib/auth/session";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  return NextResponse.json(auth.user);
}
