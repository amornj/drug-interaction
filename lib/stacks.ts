import type { InteractionSeverity, InteractionSource } from "@/lib/interactions";
import type { Drug } from "@/lib/store";

export type StackDomain =
  | "qt"
  | "bleeding"
  | "serotonergic"
  | "anticholinergic"
  | "nephrotoxic";

export type StackWarning = {
  domain: StackDomain;
  title: string;
  severity: InteractionSeverity;
  summary: string;
  matchedDrugs: Array<{ rxcui: string; name: string }>;
  sources: InteractionSource[];
};

type StackRule = {
  domain: StackDomain;
  title: string;
  matches: string[];
  highRiskMatches?: string[];
  summary: (matched: string[]) => string;
};

const STACK_RULE_SOURCE: InteractionSource = {
  name: "Cumulative stack rules",
  version: "2026-04",
};

const stackRules: StackRule[] = [
  {
    domain: "qt",
    title: "QT prolongation stack",
    matches: [
      "amiodarone",
      "sotalol",
      "quinidine",
      "azithromycin",
      "clarithromycin",
      "levofloxacin",
      "ciprofloxacin",
      "haloperidol",
      "quetiapine",
      "ziprasidone",
      "citalopram",
      "escitalopram",
      "methadone",
      "ondansetron",
    ],
    highRiskMatches: ["amiodarone", "sotalol", "quinidine", "methadone", "ziprasidone"],
    summary: (matched) =>
      `Multiple QT-risk drugs detected: ${matched.join(", ")}. Review ECG and electrolyte monitoring needs.`,
  },
  {
    domain: "bleeding",
    title: "Bleeding risk stack",
    matches: [
      "warfarin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "enoxaparin",
      "heparin",
      "aspirin",
      "clopidogrel",
      "ticagrelor",
      "prasugrel",
      "ibuprofen",
      "ketorolac",
      "naproxen",
      "diclofenac",
      "celecoxib",
      "sertraline",
      "fluoxetine",
      "paroxetine",
      "venlafaxine",
      "duloxetine",
    ],
    highRiskMatches: [
      "warfarin",
      "apixaban",
      "rivaroxaban",
      "dabigatran",
      "edoxaban",
      "enoxaparin",
      "heparin",
    ],
    summary: (matched) =>
      `Bleeding-risk drugs are stacking: ${matched.join(", ")}. Recheck additive anticoagulant, antiplatelet, NSAID, or SSRI exposure.`,
  },
  {
    domain: "serotonergic",
    title: "Serotonergic toxicity stack",
    matches: [
      "sertraline",
      "fluoxetine",
      "paroxetine",
      "citalopram",
      "escitalopram",
      "venlafaxine",
      "duloxetine",
      "tramadol",
      "linezolid",
      "amitriptyline",
      "mirtazapine",
      "sumatriptan",
      "methadone",
    ],
    highRiskMatches: ["linezolid", "tramadol", "methadone"],
    summary: (matched) =>
      `Serotonergic agents are stacking: ${matched.join(", ")}. Review for additive serotonin-toxicity risk.`,
  },
  {
    domain: "anticholinergic",
    title: "Anticholinergic burden stack",
    matches: [
      "amitriptyline",
      "diphenhydramine",
      "oxybutynin",
      "promethazine",
      "chlorpheniramine",
      "scopolamine",
      "benztropine",
      "cyclobenzaprine",
      "paroxetine",
      "tolterodine",
    ],
    summary: (matched) =>
      `Anticholinergic drugs are stacking: ${matched.join(", ")}. Review cumulative delirium, constipation, retention, and fall risk.`,
  },
  {
    domain: "nephrotoxic",
    title: "Nephrotoxic burden stack",
    matches: [
      "ibuprofen",
      "ketorolac",
      "naproxen",
      "diclofenac",
      "celecoxib",
      "gentamicin",
      "tobramycin",
      "vancomycin",
      "tacrolimus",
      "cyclosporine",
      "amphotericin b",
      "lisinopril",
      "enalapril",
      "losartan",
      "valsartan",
      "furosemide",
    ],
    highRiskMatches: ["gentamicin", "tobramycin", "vancomycin", "amphotericin b", "tacrolimus", "cyclosporine"],
    summary: (matched) =>
      `Nephrotoxic exposures are stacking: ${matched.join(", ")}. Review additive kidney-injury risk and monitoring needs.`,
  },
];

function normalizeDrugName(name: string) {
  return name.toLowerCase().replace(/\([^)]*\)/g, " ").replace(/\s+/g, " ").trim();
}

function detectSeverity(rule: StackRule, matchedKeywords: string[], count: number): InteractionSeverity {
  if (count >= 3) {
    return "Major";
  }

  if (rule.highRiskMatches?.some((keyword) => matchedKeywords.includes(keyword))) {
    return "Major";
  }

  return "Moderate";
}

export function detectCumulativeStacks(drugs: Drug[]): StackWarning[] {
  const normalizedDrugs = drugs.map((drug) => ({
    ...drug,
    normalizedName: normalizeDrugName(drug.name),
  }));

  const warnings = stackRules
    .map((rule) => {
      const matchedDrugs = normalizedDrugs.filter((drug) =>
        rule.matches.some((match) => drug.normalizedName.includes(match))
      );

      if (matchedDrugs.length < 2) {
        return null;
      }

      const matchedKeywords = rule.matches.filter((match) =>
        matchedDrugs.some((drug) => drug.normalizedName.includes(match))
      );

      return {
        domain: rule.domain,
        title: rule.title,
        severity: detectSeverity(rule, matchedKeywords, matchedDrugs.length),
        summary: rule.summary(matchedDrugs.map((drug) => drug.name)),
        matchedDrugs: matchedDrugs.map((drug) => ({
          rxcui: drug.rxcui,
          name: drug.name,
        })),
        sources: [STACK_RULE_SOURCE],
      } satisfies StackWarning;
    })
    .filter((warning): warning is StackWarning => warning !== null);

  warnings.sort((left, right) => {
    const severityOrder: Record<InteractionSeverity, number> = {
      Contraindicated: 0,
      Major: 1,
      Moderate: 2,
      Minor: 3,
    };

    const severityDiff = severityOrder[left.severity] - severityOrder[right.severity];
    if (severityDiff !== 0) {
      return severityDiff;
    }

    return left.title.localeCompare(right.title);
  });

  return warnings;
}
