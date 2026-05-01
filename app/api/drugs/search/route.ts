import { NextRequest, NextResponse } from "next/server";
import { searchRxNorm, resolveToIngredient } from "@/lib/rxnorm";
import { lookupIngredient, hasIngredientMap } from "@/lib/data/rxcui-ingredients";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q") ?? "";
  const candidates = await searchRxNorm(q, 20);

  // Resolve each candidate to an ingredient.
  // Use local pre-built map for known RxCUIs; fall back to RxNorm API for unknown ones.
  const resolved = await Promise.all(
    candidates.map(async (c) => {
      if (hasIngredientMap(c.rxcui)) {
        const ingredient = lookupIngredient(c.rxcui);
        return ingredient ? c : null;
      }
      const ingredient = await resolveToIngredient(c.rxcui);
      return ingredient ? c : null;
    })
  );

  const results = resolved.filter((c): c is NonNullable<typeof c> => c !== null).slice(0, 10);
  return NextResponse.json({ results });
}
