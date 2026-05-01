import raw from "@/lib/data/overlay/index.json";
import { ddinterRxcuiNames } from "@/lib/data/ddinter";
import { brandRxcuiNames } from "@/lib/data/brands";

export type OverlayEntry = {
  key: string;
  pair: [string, string];
  suppress?: boolean;
  severity?: "Contraindicated" | "Major" | "Moderate" | "Minor";
  verdict?: string;
  mechanism_class?: string;
  management?: string;
  sources: Array<{ name: string; version: string }>;
  file: string;
};

function getRxcuiName(rxcui: string): string | undefined {
  return ddinterRxcuiNames[rxcui] ?? brandRxcuiNames[rxcui];
}

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function namesMatch(appName: string, overlayName: string): boolean {
  const a = normalizeForMatch(appName);
  const b = normalizeForMatch(overlayName);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length > 3 && b.includes(a)) return true;
  if (b.length > 3 && a.includes(b)) return true;
  return false;
}

// Build a name-based index for clinical-overlay entries so lookups work
// even when resolveToIngredient returns a different RxCUI (e.g. salt → base).
export const clinicalNameIndex: Array<{
  key: string;
  nameA: string;
  nameB: string;
  entry: OverlayEntry;
}> = (() => {
  const index: Array<{ key: string; nameA: string; nameB: string; entry: OverlayEntry }> = [];
  for (const entry of raw.entries as OverlayEntry[]) {
    if (!entry.sources.some((s) => s.name === "Clinical overlay")) continue;
    const nameA = getRxcuiName(entry.pair[0]);
    const nameB = getRxcuiName(entry.pair[1]);
    if (nameA && nameB) {
      index.push({ key: entry.key, nameA, nameB, entry });
    }
  }
  return index;
})();

// Build a fast lookup map: normalized name → overlays that include that name.
// This reduces the O(n) scan to a small subset search.
const clinicalOverlayByName = (() => {
  const map = new Map<string, OverlayEntry[]>();
  for (const { nameA, nameB, entry } of clinicalNameIndex) {
    const normA = normalizeForMatch(nameA);
    const normB = normalizeForMatch(nameB);
    if (!map.has(normA)) map.set(normA, []);
    if (!map.has(normB)) map.set(normB, []);
    map.get(normA)!.push(entry);
    // Avoid duplicate push when both names normalize to the same value
    if (normB !== normA) {
      map.get(normB)!.push(entry);
    }
  }
  return map;
})();

const clinicalOverlayLookupCache = new Map<string, OverlayEntry | undefined>();

export function lookupClinicalOverlayByNames(
  nameA: string,
  nameB: string
): OverlayEntry | undefined {
  const cacheKey = `${nameA}|${nameB}`;
  const cached = clinicalOverlayLookupCache.get(cacheKey);
  if (cached !== undefined || clinicalOverlayLookupCache.has(cacheKey)) {
    return cached;
  }

  const normA = normalizeForMatch(nameA);
  const candidates = clinicalOverlayByName.get(normA);

  if (candidates) {
    for (const entry of candidates) {
      const oNameA = getRxcuiName(entry.pair[0]) ?? "";
      const oNameB = getRxcuiName(entry.pair[1]) ?? "";
      const aMatchesB = namesMatch(nameA, oNameA) && namesMatch(nameB, oNameB);
      const bMatchesA = namesMatch(nameA, oNameB) && namesMatch(nameB, oNameA);
      if (aMatchesB || bMatchesA) {
        clinicalOverlayLookupCache.set(cacheKey, entry);
        return entry;
      }
    }
  }

  // Fallback: full scan for edge cases (e.g. fuzzy match not caught by exact-normalized index)
  for (const { nameA: oNameA, nameB: oNameB, entry } of clinicalNameIndex) {
    const aMatchesB = namesMatch(nameA, oNameA) && namesMatch(nameB, oNameB);
    const bMatchesA = namesMatch(nameA, oNameB) && namesMatch(nameB, oNameA);
    if (aMatchesB || bMatchesA) {
      clinicalOverlayLookupCache.set(cacheKey, entry);
      return entry;
    }
  }

  clinicalOverlayLookupCache.set(cacheKey, undefined);
  return undefined;
}

export const overlayGeneratedAt = raw.generatedAt;
export const overlayVersion = raw.overlayVersion;
export const overlayEntries = raw.entries as OverlayEntry[];
export const overlayIndex = new Map(
  overlayEntries.map((entry) => [entry.key, entry] as const)
);
