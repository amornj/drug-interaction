import raw from "@/lib/data/ddinter/index.json";

// RxCUIs referenced in overlays but missing from the original DDInter mapping
const rxcuiNameOverrides: Record<string, string> = {
  "6448": "Lithium",
  "24947": "Ferrous sulfate",
  "1546356": "Dabigatran",
};

export const ddinterGeneratedAt = raw.generatedAt;
export const ddinterVersion = raw.ddinterVersion;
export const ddinterPairIndex = raw.pairIndex as Record<string, number>;
export const ddinterIndex = new Map(
  Object.entries(raw.pairIndex) as Array<[string, number]>
);
export const ddinterRxcuiNames = {
  ...(raw.rxcuiNames as Record<string, string>),
  ...rxcuiNameOverrides,
} as Record<string, string>;
