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

export function lookupClinicalOverlayByNames(
  nameA: string,
  nameB: string
): OverlayEntry | undefined {
  for (const { nameA: oNameA, nameB: oNameB, entry } of clinicalNameIndex) {
    const aMatchesB = namesMatch(nameA, oNameA) && namesMatch(nameB, oNameB);
    const bMatchesA = namesMatch(nameA, oNameB) && namesMatch(nameB, oNameA);
    if (aMatchesB || bMatchesA) {
      return entry;
    }
  }
  return undefined;
}

export const overlayGeneratedAt = raw.generatedAt;
export const overlayVersion = raw.overlayVersion;
export const overlayEntries = raw.entries as OverlayEntry[];
export const overlayIndex = new Map(
  overlayEntries.map((entry) => [entry.key, entry] as const)
);
