import { NextRequest, NextResponse } from "next/server";
import { searchRxNorm, resolveToIngredient } from "@/lib/rxnorm";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const candidates = await searchRxNorm(q, 20);

  // Resolve each candidate to an ingredient; only return those that map to a generic.
  const resolved = await Promise.all(
    candidates.map(async (c) => {
      const ingredient = await resolveToIngredient(c.rxcui);
      return ingredient ? c : null;
    })
  );

  const results = resolved.filter((c): c is NonNullable<typeof c> => c !== null).slice(0, 10);
  return NextResponse.json({ results });
}
