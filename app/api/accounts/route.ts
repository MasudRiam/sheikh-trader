import { NextResponse } from "next/server";
import { getAccounts } from "@/app/lib/queries/accounts";

export async function GET() {
  try {
    return NextResponse.json(await getAccounts());
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
