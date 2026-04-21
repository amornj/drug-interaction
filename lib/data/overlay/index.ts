import raw from "@/lib/data/overlay/index.json";

export type OverlayEntry = {
  key: string;
  pair: [string, string];
  severity: "Contraindicated" | "Major" | "Moderate" | "Minor";
  verdict: string;
  mechanism_class?: string;
  management?: string;
  sources: Array<{ name: string; version: string }>;
  file: string;
};

export const overlayGeneratedAt = raw.generatedAt;
export const overlayVersion = raw.overlayVersion;
export const overlayEntries = raw.entries as OverlayEntry[];
export const overlayIndex = new Map(
  overlayEntries.map((entry) => [entry.key, entry] as const)
);
