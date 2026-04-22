import raw from "@/lib/data/brands/index.json";

export type BrandEntry = {
  term: string;
  normalizedTerm: string;
  components: Array<{ rxcui: string; name: string }>;
  sources: Array<{ name: string; version: string }>;
  file: string;
};

export const brandsGeneratedAt = raw.generatedAt;
export const brandsVersion = raw.brandsVersion;
export const brandEntries = raw.entries as BrandEntry[];
export const brandIndex = new Map(
  brandEntries.map((entry) => [entry.normalizedTerm, entry] as const)
);
