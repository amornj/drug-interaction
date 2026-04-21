import { NextRequest, NextResponse } from "next/server";
import { searchRxNorm } from "@/lib/rxnorm";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const results = await searchRxNorm(q, 10);
  return NextResponse.json({ results });
}
