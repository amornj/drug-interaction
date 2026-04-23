import type { InteractionSeverity, InteractionSource } from "@/lib/interactions";
import type { Drug } from "@/lib/store";

export type StackDomain =
  | "qt"
  | "bleeding"
  | "serotonergic"
  | "anticholinergic"
  | "eps"
  | "nephrotoxic"
  | "hyperkalemia"
  | "hypokalemia"
  | "hypoglycemia"
  | "hyperglycemia";

export type StackWarning = {
  domain: StackDomain;
  title: string;
  severity: InteractionSeverity;
  summary: string;
  matchedDrugs: Array<{ rxcui: string; name: string }>;
  sources: InteractionSource[];
};

type NormalizedDrug = Drug & { normalizedName: string };

type StackRule = {
  domain: StackDomain;
  title: string;
  matches: string[];
  highRiskMatches?: string[];
  summary: (matched: string[]) => string;
  detectSeverity?: (
    matchedKeywords: string[],
    matchedDrugs: NormalizedDrug[]
  ) => InteractionSeverity;
};

const STACK_RULE_SOURCE: InteractionSource = {
  name: "Cumulative stack rules",
  version: "2026-04-cardiometabolic",
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
      `Multiple QT-risk drugs detected: ${matched.join(", ")}. Review ECG and electrolyte monitoring needs, especially if potassium or magnesium may drift low.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasHighRiskQt = ["amiodarone", "sotalol", "quinidine", "methadone", "ziprasidone"].some((keyword) => matchedKeywords.includes(keyword));
      const hasHypokalemiaDrivers = matchedDrugs.some((drug) =>
        [
          "furosemide",
          "bumetanide",
          "torsemide",
          "hydrochlorothiazide",
          "chlorthalidone",
          "indapamide",
          "metolazone",
          "insulin",
          "albuterol",
          "salbutamol",
          "terbutaline",
        ].some((keyword) => drug.normalizedName.includes(keyword))
      );

      if (matchedDrugs.length >= 2 || (hasHighRiskQt && hasHypokalemiaDrivers)) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hyperkalemia",
    title: "Hyperkalemia risk stack",
    matches: [
      "spironolactone",
      "eplerenone",
      "amiloride",
      "triamterene",
      "lisinopril",
      "enalapril",
      "ramipril",
      "perindopril",
      "losartan",
      "valsartan",
      "candesartan",
      "irbesartan",
      "telmisartan",
      "sacubitril/valsartan",
      "trimethoprim",
      "tacrolimus",
      "cyclosporine",
      "potassium chloride",
    ],
    highRiskMatches: [
      "spironolactone",
      "eplerenone",
      "amiloride",
      "triamterene",
      "trimethoprim",
      "tacrolimus",
      "cyclosporine",
      "potassium chloride",
    ],
    summary: (matched) =>
      `Hyperkalemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck potassium and renal function, especially with RAAS blockade or potassium supplementation.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasMra = ["spironolactone", "eplerenone", "amiloride", "triamterene"].some((keyword) => matchedKeywords.includes(keyword));
      const raasCount = [
        "lisinopril",
        "enalapril",
        "ramipril",
        "perindopril",
        "losartan",
        "valsartan",
        "candesartan",
        "irbesartan",
        "telmisartan",
        "sacubitril/valsartan",
      ].filter((keyword) => matchedKeywords.includes(keyword)).length;
      const hasPotassiumSupplement = matchedKeywords.includes("potassium chloride");
      const hasCkdModifier = matchedDrugs.some((drug) =>
        ["finerenone", "spironolactone", "eplerenone", "lisinopril", "losartan", "valsartan", "sacubitril/valsartan"].some((keyword) =>
          drug.normalizedName.includes(keyword)
        )
      );

      if ((hasMra && raasCount >= 1) || hasPotassiumSupplement || matchedDrugs.length >= 3) {
        return "Major";
      }

      if (raasCount >= 2 || hasCkdModifier) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hypokalemia",
    title: "Hypokalemia risk stack",
    matches: [
      "furosemide",
      "bumetanide",
      "torsemide",
      "hydrochlorothiazide",
      "chlorthalidone",
      "indapamide",
      "metolazone",
      "insulin",
      "albuterol",
      "salbutamol",
      "terbutaline",
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
    ],
    highRiskMatches: [
      "furosemide",
      "bumetanide",
      "torsemide",
      "metolazone",
      "insulin",
      "albuterol",
      "salbutamol",
      "terbutaline",
    ],
    summary: (matched) =>
      `Hypokalemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck potassium, magnesium, and arrhythmia risk if diuresis or intracellular potassium shift is expected.`,
  },
  {
    domain: "hypoglycemia",
    title: "Hypoglycemia risk stack",
    matches: [
      "insulin",
      "glimepiride",
      "gliclazide",
      "glipizide",
      "glyburide",
      "glibenclamide",
      "repaglinide",
      "nateglinide",
      "linezolid",
    ],
    highRiskMatches: [
      "insulin",
      "glimepiride",
      "gliclazide",
      "glipizide",
      "glyburide",
      "glibenclamide",
      "repaglinide",
      "nateglinide",
      "linezolid",
    ],
    summary: (matched) =>
      `Hypoglycemia-risk drugs are stacking: ${matched.join(", ")}. Recheck glucose trend, meal intake, and renal function before keeping the full regimen.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasInsulin = matchedKeywords.includes("insulin");
      const hasSulfonylureaOrMeglitinide = [
        "glimepiride",
        "gliclazide",
        "glipizide",
        "glyburide",
        "glibenclamide",
        "repaglinide",
        "nateglinide",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasLinezolid = matchedKeywords.includes("linezolid");

      if (
        (hasInsulin && hasSulfonylureaOrMeglitinide) ||
        (hasLinezolid && (hasInsulin || hasSulfonylureaOrMeglitinide)) ||
        matchedDrugs.length >= 3
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "hyperglycemia",
    title: "Hyperglycemia risk stack",
    matches: [
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
      "methylprednisolone",
      "tacrolimus",
      "cyclosporine",
      "hydrochlorothiazide",
      "chlorthalidone",
      "olanzapine",
      "quetiapine",
      "risperidone",
    ],
    highRiskMatches: [
      "prednisone",
      "prednisolone",
      "hydrocortisone",
      "dexamethasone",
      "methylprednisolone",
      "tacrolimus",
      "olanzapine",
      "quetiapine",
    ],
    summary: (matched) =>
      `Hyperglycemia-promoting drugs are stacking: ${matched.join(", ")}. Recheck glucose monitoring needs and whether temporary diabetes-regimen adjustment is required.`,
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
    title: "Serotonin syndrome stack",
    matches: [
      "phenelzine",
      "tranylcypromine",
      "isocarboxazid",
      "selegiline",
      "rasagiline",
      "fluoxetine",
      "sertraline",
      "paroxetine",
      "citalopram",
      "escitalopram",
      "fluvoxamine",
      "venlafaxine",
      "desvenlafaxine",
      "duloxetine",
      "levomilnacipran",
      "tramadol",
      "linezolid",
      "methylene blue",
      "amitriptyline",
      "clomipramine",
      "imipramine",
      "nortriptyline",
      "mirtazapine",
      "trazodone",
      "methadone",
    ],
    highRiskMatches: [
      "phenelzine",
      "tranylcypromine",
      "isocarboxazid",
      "selegiline",
      "rasagiline",
      "linezolid",
      "methylene blue",
      "tramadol",
      "methadone",
    ],
    summary: (matched) =>
      `High-risk serotonergic combination detected: ${matched.join(", ")}. Review serotonin syndrome risk, especially with MAOI exposure, tramadol, linezolid, methylene blue, or multiple antidepressants.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const hasMaoi = ["phenelzine", "tranylcypromine", "isocarboxazid", "selegiline", "rasagiline"].some((keyword) => matchedKeywords.includes(keyword));
      const hasSsriSnri = [
        "fluoxetine",
        "sertraline",
        "paroxetine",
        "citalopram",
        "escitalopram",
        "fluvoxamine",
        "venlafaxine",
        "desvenlafaxine",
        "duloxetine",
        "levomilnacipran",
      ].some((keyword) => matchedKeywords.includes(keyword));
      const hasTramadol = matchedKeywords.includes("tramadol");
      const hasLinezolid = matchedKeywords.includes("linezolid");
      const hasMethyleneBlue = matchedKeywords.includes("methylene blue");
      const antidepressantCount = matchedDrugs.filter((drug) =>
        [
          "fluoxetine",
          "sertraline",
          "paroxetine",
          "citalopram",
          "escitalopram",
          "fluvoxamine",
          "venlafaxine",
          "desvenlafaxine",
          "duloxetine",
          "levomilnacipran",
          "amitriptyline",
          "clomipramine",
          "imipramine",
          "nortriptyline",
          "mirtazapine",
          "trazodone",
          "phenelzine",
          "tranylcypromine",
          "isocarboxazid",
          "selegiline",
          "rasagiline",
        ].some((keyword) => drug.normalizedName.includes(keyword))
      ).length;

      if (
        (hasMaoi && hasSsriSnri) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasTramadol) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasLinezolid) ||
        ((hasSsriSnri || antidepressantCount >= 1) && hasMethyleneBlue) ||
        antidepressantCount >= 2
      ) {
        return "Major";
      }

      return "Moderate";
    },
  },
  {
    domain: "anticholinergic",
    title: "Anticholinergic syndrome stack",
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
      `Anticholinergic drugs are stacking: ${matched.join(", ")}. Review for cumulative anticholinergic syndrome risk: delirium, urinary retention, ileus, tachycardia, and hyperthermia.`,
  },
  {
    domain: "eps",
    title: "Extrapyramidal syndrome stack",
    matches: [
      "haloperidol",
      "fluphenazine",
      "perphenazine",
      "chlorpromazine",
      "risperidone",
      "paliperidone",
      "olanzapine",
      "ziprasidone",
      "metoclopramide",
      "prochlorperazine",
    ],
    highRiskMatches: ["haloperidol", "fluphenazine", "metoclopramide", "prochlorperazine"],
    summary: (matched) =>
      `Dopamine-blocking drugs are stacking: ${matched.join(", ")}. Review cumulative extrapyramidal symptom risk including dystonia, parkinsonism, akathisia, and tardive syndromes.`,
    detectSeverity: (matchedKeywords, matchedDrugs) => {
      const highRiskCount =
        ["haloperidol", "fluphenazine", "metoclopramide", "prochlorperazine"].filter((keyword) =>
          matchedKeywords.includes(keyword)
        ).length;

      if (highRiskCount >= 2 || matchedDrugs.length >= 3) {
        return "Major";
      }

      return "Moderate";
    },
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

function detectSeverity(
  rule: StackRule,
  matchedKeywords: string[],
  matchedDrugs: NormalizedDrug[],
  count: number
): InteractionSeverity {
  if (rule.detectSeverity) {
    return rule.detectSeverity(matchedKeywords, matchedDrugs);
  }

  if (rule.domain === "qt") {
    if (count >= 2) {
      return "Major";
    }
  }

  if (
    rule.domain === "hyperkalemia" ||
    rule.domain === "hypokalemia" ||
    rule.domain === "hypoglycemia" ||
    rule.domain === "hyperglycemia"
  ) {
    const highRiskCount =
      rule.highRiskMatches?.filter((keyword) => matchedKeywords.includes(keyword)).length ?? 0;

    if (count >= 3 || highRiskCount >= 2) {
      return "Major";
    }

    return "Moderate";
  }

  if (count >= 3) {
    return "Major";
  }

  if (rule.highRiskMatches?.some((keyword) => matchedKeywords.includes(keyword))) {
    return "Major";
  }

  return "Moderate";
}

export function detectCumulativeStacks(drugs: Drug[]): StackWarning[] {
  const normalizedDrugs: NormalizedDrug[] = drugs.map((drug) => ({
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
        severity: detectSeverity(rule, matchedKeywords, matchedDrugs, matchedDrugs.length),
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
