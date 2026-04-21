import {
  ddinterGeneratedAt,
  ddinterPairIndex,
  ddinterRxcuiNames,
  ddinterVersion,
} from "@/lib/data/ddinter";
import {
  overlayGeneratedAt,
  overlayIndex,
  overlayVersion,
} from "@/lib/data/overlay";

export const severityOrder = [
  "Contraindicated",
  "Major",
  "Moderate",
  "Minor",
] as const;

export type InteractionSeverity = (typeof severityOrder)[number];

export type InteractionSource = {
  name: string;
  version: string;
};

export type InteractionPair = {
  a: { rxcui: string; name: string };
  b: { rxcui: string; name: string };
  severity: InteractionSeverity;
  verdict: string;
  mechanism_class?: string;
  management?: string;
  sources: InteractionSource[];
};

export type InteractionCheckResponse = {
  pairs: InteractionPair[];
  unknown: string[];
  checkedAt: string;
  dataVersion: string;
};

const codeToSeverity: Record<number, InteractionSeverity> = {
  1: "Minor",
  2: "Moderate",
  3: "Major",
  4: "Contraindicated",
};

const severityRank: Record<InteractionSeverity, number> = {
  Contraindicated: 0,
  Major: 1,
  Moderate: 2,
  Minor: 3,
};

export const defaultPairSources: InteractionSource[] = [
  {
    name: "DDInter 2.0",
    version: ddinterGeneratedAt.slice(0, 10),
  },
];

export const dataVersion = `DDInter ${ddinterVersion} · ${ddinterGeneratedAt.slice(
  0,
  10
)} · Overlay ${overlayVersion} · ${overlayGeneratedAt.slice(0, 10)}`;

function sortedPairKey(a: string, b: string) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("|");
}

function defaultVerdictForSeverity(severity: InteractionSeverity) {
  return `${severity} interaction listed in DDInter 2.0.`;
}

export function getRxcuiName(rxcui: string) {
  return ddinterRxcuiNames[rxcui];
}

export function checkInteractions(rxcuis: string[]): InteractionCheckResponse {
  const unique = [...new Set(rxcuis)].sort((left, right) =>
    left.localeCompare(right)
  );
  const unknown = unique.filter((rxcui) => !getRxcuiName(rxcui));
  const pairs: InteractionPair[] = [];

  for (let i = 0; i < unique.length - 1; i += 1) {
    for (let j = i + 1; j < unique.length; j += 1) {
      const a = unique[i];
      const b = unique[j];
      const key = sortedPairKey(a, b);
      const overlay = overlayIndex.get(key);

      if (overlay) {
        pairs.push({
          a: { rxcui: a, name: getRxcuiName(a) ?? a },
          b: { rxcui: b, name: getRxcuiName(b) ?? b },
          severity: overlay.severity,
          verdict: overlay.verdict,
          mechanism_class: overlay.mechanism_class,
          management: overlay.management,
          sources: overlay.sources,
        });
        continue;
      }

      const ddinterSeverityCode = ddinterPairIndex[key];
      if (!ddinterSeverityCode) {
        continue;
      }

      const severity = codeToSeverity[ddinterSeverityCode];
      pairs.push({
        a: { rxcui: a, name: getRxcuiName(a) ?? a },
        b: { rxcui: b, name: getRxcuiName(b) ?? b },
        severity,
        verdict: defaultVerdictForSeverity(severity),
        sources: defaultPairSources,
      });
    }
  }

  pairs.sort((left, right) => {
    const severityDiff =
      severityRank[left.severity] - severityRank[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }
    const pairALabel = `${left.a.name}|${left.b.name}`;
    const pairBLabel = `${right.a.name}|${right.b.name}`;
    return pairALabel.localeCompare(pairBLabel);
  });

  return {
    pairs,
    unknown,
    checkedAt: new Date().toISOString(),
    dataVersion,
  };
}
