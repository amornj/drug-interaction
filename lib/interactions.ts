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
import { brandRxcuiNames } from "@/lib/data/brands";

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

export const explanationLabels = ["SUMMARY", "MONITOR", "AVOID"] as const;

export type ExplanationLabel = (typeof explanationLabels)[number];

export type InteractionExplanationSections = Record<ExplanationLabel, string>;

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

export function formatSources(sources: InteractionSource[]) {
  return sources
    .map((source) => `${source.name} · ${source.version}`)
    .join(" · ");
}

export function pairKey(pair: Pick<InteractionPair, "a" | "b">) {
  return sortedPairKey(pair.a.rxcui, pair.b.rxcui);
}

function sortedPairKey(a: string, b: string) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("|");
}

function defaultVerdictForSeverity(severity: InteractionSeverity) {
  return `${severity} interaction listed in DDInter 2.0.`;
}

export function getRxcuiName(rxcui: string) {
  return ddinterRxcuiNames[rxcui] ?? brandRxcuiNames[rxcui];
}

function buildAvoidanceGuidance(pair: InteractionPair) {
  if (pair.severity === "Contraindicated") {
    return "Avoid this combination. The current deterministic data marks it as Contraindicated.";
  }

  const explicitAvoidSource = [pair.management, pair.verdict].find((value) =>
    value ? /\b(avoid|alternative|contraindicat|unavoidable)\b/i.test(value) : false
  );

  if (explicitAvoidSource) {
    return explicitAvoidSource;
  }

  return "Not available in current deterministic data.";
}

function buildMonitoringGuidance(pair: InteractionPair) {
  if (pair.management) {
    return pair.management;
  }

  return "Not available in current deterministic data.";
}

export function buildExplanationPrompt(
  pair: InteractionPair,
  currentDataVersion: string
) {
  const pairLabel = `${pair.a.name} ↔ ${pair.b.name}`;

  return [
    "You are a clinical copy editor for a bedside drug interaction checker.",
    "Rewrite only the deterministic facts provided below.",
    "Do not add any risks, organs, mechanisms, alternatives, severity upgrades, monitoring steps, or avoid recommendations unless they appear verbatim or by direct restatement in the facts.",
    "If a fact is unavailable, say exactly: Not available in current deterministic data.",
    "Return exactly 3 lines and nothing else.",
    "Each line must be one short sentence and start with one of these labels exactly:",
    "SUMMARY:",
    "MONITOR:",
    "AVOID:",
    "",
    `PAIR: ${pairLabel}`,
    `DATA VERSION: ${currentDataVersion}`,
    `SEVERITY: ${pair.severity}`,
    `VERDICT: ${pair.verdict}`,
    `MECHANISM: ${pair.mechanism_class ?? "Not available in current deterministic data."}`,
    `MANAGEMENT: ${pair.management ?? "Not available in current deterministic data."}`,
    `MONITOR FACT: ${buildMonitoringGuidance(pair)}`,
    `AVOID FACT: ${buildAvoidanceGuidance(pair)}`,
    `SOURCES: ${formatSources(pair.sources)}`,
    "",
    "Rewrite rules:",
    "- SUMMARY may only restate the severity, verdict, and mechanism.",
    "- MONITOR may only restate MONITOR FACT.",
    "- AVOID may only restate AVOID FACT.",
    "- Keep the drug names exactly as provided.",
  ].join("\n");
}

export function parseExplanationText(
  text: string
): Partial<InteractionExplanationSections> {
  const sections: Partial<InteractionExplanationSections> = {};

  for (const label of explanationLabels) {
    const marker = `${label}:`;
    const start = text.indexOf(marker);
    if (start === -1) {
      continue;
    }

    const from = start + marker.length;
    const nextStarts = explanationLabels
      .filter((candidate) => candidate !== label)
      .map((candidate) => text.indexOf(`${candidate}:`, from))
      .filter((index) => index !== -1);
    const end =
      nextStarts.length > 0 ? Math.min(...nextStarts) : text.length;

    sections[label] = text.slice(from, end).trim();
  }

  return sections;
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
