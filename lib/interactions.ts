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
import { classifyInteractionConfidence } from "@/lib/confidence";
import {
  formatSources,
  type InteractionCheckResponse,
  type InteractionPair,
  type InteractionSeverity,
  type InteractionSource,
} from "@/lib/interaction-types";
export type {
  InteractionCheckResponse,
  InteractionPair,
  InteractionSeverity,
  InteractionSource,
} from "@/lib/interaction-types";
export { formatSources, severityOrder } from "@/lib/interaction-types";

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

const gastricAcidRuleSources: InteractionSource[] = [
  {
    name: "Local acid-suppression rule",
    version: overlayVersion,
  },
];

const gastricAcidDependentDrugs = new Set([
  "ketoconazole",
  "itraconazole",
  "posaconazole",
  "erlotinib",
  "gefitinib",
  "dasatinib",
  "nilotinib",
  "pazopanib",
  "atazanavir",
  "rilpivirine",
]);

const acidReductionDrugs = new Set([
  "omeprazole",
  "esomeprazole",
  "pantoprazole",
  "rabeprazole",
  "lansoprazole",
  "dexlansoprazole",
  "famotidine",
  "cimetidine",
  "nizatidine",
  "vonoprazan",
  "aluminum hydroxide",
  "magnesium hydroxide",
  "calcium carbonate",
  "sodium bicarbonate",
]);

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

export function pairKey(pair: Pick<InteractionPair, "a" | "b">) {
  return sortedPairKey(pair.a.rxcui, pair.b.rxcui);
}

function sortedPairKey(a: string, b: string) {
  return [a, b].sort((left, right) => left.localeCompare(right)).join("|");
}

function normalizeDrugName(name: string) {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, " ")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function detectGastricAcid(
  a: string,
  b: string
): { dependentDrug: string; acidReducer: string } | null {
  const nameA = getRxcuiName(a) ?? a;
  const nameB = getRxcuiName(b) ?? b;
  const normalizedA = normalizeDrugName(nameA);
  const normalizedB = normalizeDrugName(nameB);

  const aIsDependent = gastricAcidDependentDrugs.has(normalizedA);
  const bIsDependent = gastricAcidDependentDrugs.has(normalizedB);
  const aIsReducer = acidReductionDrugs.has(normalizedA);
  const bIsReducer = acidReductionDrugs.has(normalizedB);

  if (aIsDependent && bIsReducer) {
    return { dependentDrug: nameA, acidReducer: nameB };
  }
  if (bIsDependent && aIsReducer) {
    return { dependentDrug: nameB, acidReducer: nameA };
  }
  return null;
}

function buildGastricAcidVerdict(
  dependentDrug: string,
  acidReducer: string
): string {
  return `${acidReducer} raises gastric pH and can reduce absorption of ${dependentDrug}, causing loss of exposure and treatment failure risk.`;
}

function buildGastricAcidManagement(): string {
  return "Avoid this combination if possible. Prefer a non-acid-suppressive alternative, a different formulation, or a non-pH-dependent drug when reliable exposure is critical.";
}

function augmentWithGastricAcid(
  pair: InteractionPair,
  gastric: { dependentDrug: string; acidReducer: string }
): InteractionPair {
  const gastricVerdict = buildGastricAcidVerdict(
    gastric.dependentDrug,
    gastric.acidReducer
  );
  const gastricManagement = buildGastricAcidManagement();
  const hasGastricInVerdict = pair.verdict.toLowerCase().includes("gastric");

  return {
    ...pair,
    confidence: "pk_confirmed",
    pkMechanisms: [
      ...pair.pkMechanisms.filter((m) => m.kind !== "gastric_ph"),
      { kind: "gastric_ph", system: "Gastric pH" },
    ],
    verdict: hasGastricInVerdict
      ? pair.verdict
      : `${gastricVerdict} ${pair.verdict}`,
    mechanism_class: pair.mechanism_class
      ? `${pair.mechanism_class}; Increased gastric pH / reduced absorption`
      : "Increased gastric pH / reduced absorption",
    management: pair.management
      ? `${pair.management} ${gastricManagement}`
      : gastricManagement,
    sources: [
      ...pair.sources.filter(
        (s) => s.name !== "Local acid-suppression rule"
      ),
      ...gastricAcidRuleSources,
    ],
  };
}

function buildGastricAcidOnlyPair(
  a: string,
  b: string,
  gastric: { dependentDrug: string; acidReducer: string }
): InteractionPair {
  return {
    a: { rxcui: a, name: getRxcuiName(a) ?? a },
    b: { rxcui: b, name: getRxcuiName(b) ?? b },
    severity: "Major",
    confidence: "pk_confirmed",
    lowConfidence: false,
    pkMechanisms: [{ kind: "gastric_ph", system: "Gastric pH" }],
    verdict: buildGastricAcidVerdict(gastric.dependentDrug, gastric.acidReducer),
    mechanism_class: "Increased gastric pH / reduced absorption",
    management: buildGastricAcidManagement(),
    sources: gastricAcidRuleSources,
  };
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
      const nameA = getRxcuiName(a) ?? a;
      const nameB = getRxcuiName(b) ?? b;

      const classification = classifyInteractionConfidence(nameA, nameB);
      const { confidence, pkMechanisms } = classification;
      const gastricAcid = detectGastricAcid(a, b);

      let pair: InteractionPair | null = null;

      if (overlay) {
        pair = {
          a: { rxcui: a, name: nameA },
          b: { rxcui: b, name: nameB },
          severity: overlay.severity ?? "Moderate",
          confidence,
          lowConfidence: false,
          pkMechanisms,
          verdict: overlay.verdict ?? "Reviewed interaction overlay.",
          mechanism_class: overlay.mechanism_class,
          management: overlay.management,
          sources: overlay.sources,
        };
      }

      if (!pair) {
        const ddinterSeverityCode = ddinterPairIndex[key];
        if (ddinterSeverityCode) {
          const severity = codeToSeverity[ddinterSeverityCode];
          pair = {
            a: { rxcui: a, name: nameA },
            b: { rxcui: b, name: nameB },
            severity,
            confidence,
            lowConfidence: confidence === "unverified",
            pkMechanisms,
            verdict: defaultVerdictForSeverity(severity),
            sources: defaultPairSources,
          };
        }
      }

      if (gastricAcid) {
        if (pair) {
          pair = augmentWithGastricAcid(pair, gastricAcid);
        } else {
          pair = buildGastricAcidOnlyPair(a, b, gastricAcid);
        }
      }

      if (pair) {
        pairs.push(pair);
      }
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
