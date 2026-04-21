import raw from "@/lib/data/ddinter/index.json";

export const ddinterGeneratedAt = raw.generatedAt;
export const ddinterVersion = raw.ddinterVersion;
export const ddinterPairIndex = raw.pairIndex as Record<string, number>;
export const ddinterIndex = new Map(
  Object.entries(raw.pairIndex) as Array<[string, number]>
);
export const ddinterRxcuiNames = raw.rxcuiNames as Record<string, string>;
