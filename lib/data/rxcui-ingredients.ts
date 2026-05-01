import raw from "@/lib/data/rxcui-ingredients.json";

export type ResolvedIngredient =
  | { type: "single"; rxcui: string; name: string }
  | { type: "combination"; components: Array<{ rxcui: string; name: string }> };

const ingredientMap = raw as Record<string, ResolvedIngredient | null>;

export function lookupIngredient(rxcui: string): ResolvedIngredient | undefined {
  return ingredientMap[rxcui] ?? undefined;
}

export function hasIngredientMap(rxcui: string): boolean {
  return rxcui in ingredientMap;
}
